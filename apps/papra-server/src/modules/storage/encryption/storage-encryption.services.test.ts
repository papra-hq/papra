import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import {
  collectReadableStreamToString,
  createReadableStream,
} from '../../shared/streams/readable-stream';
import { inMemoryStorageDriverFactory } from '../drivers/memory/memory.storage-driver';
import { createUnsupportedEncryptionAlgorithmError } from './storage-encryption.errors';
import { wrapWithEncryptionLayer } from './storage-encryption.services';

const firstKek = { version: '1', key: Buffer.alloc(32, 1) };
const secondKek = { version: '2', key: Buffer.alloc(32, 2) };

describe('storage-encryption services', () => {
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
