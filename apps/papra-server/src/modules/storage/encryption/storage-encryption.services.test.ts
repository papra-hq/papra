import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import {
  collectReadableStreamToBuffer,
  collectReadableStreamToString,
  createReadableStream,
} from '../../shared/streams/readable-stream';
import { inMemoryStorageDriverFactory } from '../drivers/memory/memory.storage-driver';
import { createUnsupportedEncryptionAlgorithmError } from './storage-encryption.errors';
import { wrapWithEncryptionLayer } from './storage-encryption.services';

const firstKek = { version: '1', key: Buffer.alloc(32, 1) };
const secondKek = { version: '2', key: Buffer.alloc(32, 2) };

describe('storage-encryption services', () => {
  test('copies identical ciphertext and decrypts with the source context after key rotation', async () => {
    const storageDriver = inMemoryStorageDriverFactory();
    const writer = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: true, keyEncryptionKeys: [firstKek] },
    });
    const encryptionContext = await writer.saveFile({
      storageKey: 'source.txt',
      fileName: 'source.txt',
      mimeType: 'text/plain',
      fileStream: createReadableStream({ content: 'encrypted content' }),
    });
    const storageService = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: true, keyEncryptionKeys: [firstKek, secondKek] },
    });

    await storageService.copyFile({
      sourceStorageKey: 'source.txt',
      destinationStorageKey: 'copy.txt',
    });

    const { fileStream: sourceStream } = await storageDriver.getFileStream({
      storageKey: 'source.txt',
    });
    const { fileStream: destinationStream } = await storageDriver.getFileStream({
      storageKey: 'copy.txt',
    });
    const sourceCiphertext = await collectReadableStreamToBuffer({ stream: sourceStream });
    const destinationCiphertext = await collectReadableStreamToBuffer({
      stream: destinationStream,
    });
    expect(sourceCiphertext).not.toEqual(Buffer.from('encrypted content'));
    expect(destinationCiphertext).toEqual(sourceCiphertext);
    expect(encryptionContext.fileEncryptionKekVersion).toEqual(firstKek.version);

    const { fileStream } = await storageService.getFileStream({
      storageKey: 'copy.txt',
      ...encryptionContext,
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual(
      'encrypted content',
    );
  });

  test('copies encrypted bytes without encryption keys after encryption is disabled', async () => {
    const storageDriver = inMemoryStorageDriverFactory();
    const writer = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: true, keyEncryptionKeys: [firstKek] },
    });
    const encryptionContext = await writer.saveFile({
      storageKey: 'source.txt',
      fileName: 'source.txt',
      mimeType: 'text/plain',
      fileStream: createReadableStream({ content: 'encrypted content' }),
    });
    const copier = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: false, keyEncryptionKeys: [] },
    });

    await copier.copyFile({ sourceStorageKey: 'source.txt', destinationStorageKey: 'copy.txt' });

    const { fileStream: sourceStream } = await storageDriver.getFileStream({
      storageKey: 'source.txt',
    });
    const { fileStream: destinationStream } = await storageDriver.getFileStream({
      storageKey: 'copy.txt',
    });
    expect(await collectReadableStreamToBuffer({ stream: destinationStream })).toEqual(
      await collectReadableStreamToBuffer({ stream: sourceStream }),
    );
    const { fileStream } = await writer.getFileStream({
      storageKey: 'copy.txt',
      ...encryptionContext,
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual(
      'encrypted content',
    );
  });

  test('copies unencrypted files without encrypting them after encryption is enabled', async () => {
    const storageDriver = inMemoryStorageDriverFactory();
    const writer = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: false, keyEncryptionKeys: [] },
    });
    const encryptionContext = await writer.saveFile({
      storageKey: 'source.txt',
      fileName: 'source.txt',
      mimeType: 'text/plain',
      fileStream: createReadableStream({ content: 'unencrypted content' }),
    });
    const copier = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: { isEncryptionEnabled: true, keyEncryptionKeys: [] },
    });

    await copier.copyFile({ sourceStorageKey: 'source.txt', destinationStorageKey: 'copy.txt' });

    expect(encryptionContext).toEqual({});
    const { fileStream } = await copier.getFileStream({
      storageKey: 'copy.txt',
      ...encryptionContext,
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual(
      'unencrypted content',
    );
  });

  test('decrypts a file with the KEK version stored in its encryption context', async () => {
    const storageDriver = inMemoryStorageDriverFactory();
    const writer = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: {
        isEncryptionEnabled: true,
        keyEncryptionKeys: [firstKek],
      },
    });
    const encryptionContext = await writer.saveFile({
      fileStream: createReadableStream({ content: 'encrypted content' }),
      fileName: 'test.txt',
      mimeType: 'text/plain',
      storageKey: 'test.txt',
    });

    expect(encryptionContext.fileEncryptionKekVersion).toBe(firstKek.version);

    const reader = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: {
        isEncryptionEnabled: true,
        keyEncryptionKeys: [firstKek, secondKek],
      },
    });
    const { fileStream } = await reader.getFileStream({
      storageKey: 'test.txt',
      ...encryptionContext,
    });

    await expect(collectReadableStreamToString({ stream: fileStream })).resolves.toBe(
      'encrypted content',
    );
  });

  test('rejects unsupported encryption algorithms', async () => {
    const storageDriver = inMemoryStorageDriverFactory();
    await storageDriver.saveFile({
      fileStream: createReadableStream({ content: 'stored content' }),
      fileName: 'test.txt',
      mimeType: 'text/plain',
      storageKey: 'test.txt',
    });
    const storageService = wrapWithEncryptionLayer({
      storageDriver,
      encryptionOptions: {
        isEncryptionEnabled: false,
        keyEncryptionKeys: [],
      },
    });

    await expect(
      storageService.getFileStream({
        storageKey: 'test.txt',
        fileEncryptionKeyWrapped: 'wrapped-key',
        fileEncryptionKekVersion: firstKek.version,
        fileEncryptionAlgorithm: 'unsupported',
      }),
    ).rejects.toThrow(createUnsupportedEncryptionAlgorithmError());
  });
});
