import type { StorageDriver, StorageServices } from './drivers.models';
import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { collectReadableStreamToString, createReadableStream } from '../../../shared/streams/readable-stream';
import { createFileNotFoundError } from '../document-storage.errors';
import { wrapWithEncryptionLayer } from '../encryption/document-encryption.services';

export function runDriverTestSuites({ createDriver: createDriverBase, timeout, retry }: { createDriver: () => Promise<{ driver: StorageDriver; [Symbol.asyncDispose]: () => Promise<void> }>; timeout?: number; retry?: number }) {
  [
    {
      name: 'without encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriverBase();

        return {
          storageServices: driver as StorageServices,
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
    {
      name: 'with encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriverBase();

        return {
          storageServices: wrapWithEncryptionLayer({ storageDriver: driver, encryptionConfig: { isEncryptionEnabled: true, documentKeyEncryptionKeys: [{ version: '1', key: Buffer.from('622b55bec85b3fca6fbad2d1c5ef1d67ed19b24eece069961cd430370735c2ff', 'hex') }] } }),
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
  ].forEach(({ createStorageService, name }) => {
    describe(name, () => {
      test('the driver should support uploading, retrieving and deleting files', { timeout, retry }, async () => {
        await using resource = await createStorageService();

        const { storageServices } = resource;

        // 1. Save the file
        const storageContext = await storageServices.saveFile({
          fileName: 'test.txt',
          mimeType: 'text/plain',
          storageKey: 'files/test.txt',
          fileStream: createReadableStream({ content: 'Hello, world!' }),
        });

        // 2. Retrieve the file
        const { fileStream } = await storageServices.getFileStream({ ...storageContext, storageKey: 'files/test.txt' });
        expect(await collectReadableStreamToString({ stream: fileStream })).to.eql('Hello, world!');

        // 3. Delete the file
        await storageServices.deleteFile({ storageKey: 'files/test.txt' });
        await expect(storageServices.getFileStream({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());

        // 4. Try to delete the file again
        await expect(storageServices.deleteFile({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });
  });
}
