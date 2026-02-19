import type { StorageDriver, StorageServices } from './drivers.models';
import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { collectReadableStreamToString, createReadableStream } from '../../../shared/streams/readable-stream';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../document-storage.errors';
import { wrapWithEncryptionLayer } from '../encryption/document-encryption.services';

export function runDriverTestSuites({ createDriver: createDriverBase, timeout, retry }: { createDriver: () => Promise<{ driver: StorageDriver; [Symbol.asyncDispose]: () => Promise<void> }>; timeout?: number; retry?: number }) {
  [
    {
      name: 'without encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriverBase();

        return {
          storageServices: {
            ...driver,
            saveFile: async (args) => {
              await driver.saveFile(args);
              return {};
            },
          } as StorageServices,
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
    {
      name: 'with encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriverBase();

        return {
          storageServices: wrapWithEncryptionLayer({
            storageDriver: driver,
            encryptionConfig: {
              isEncryptionEnabled: true,
              documentKeyEncryptionKeys: [
                { version: '1', key: Buffer.from('622b55bec85b3fca6fbad2d1c5ef1d67ed19b24eece069961cd430370735c2ff', 'hex') },
              ],
            },
          }),
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
  ].forEach(({ createStorageService, name }) => {
    describe.concurrent(name, () => {
      test('the driver should support uploading, retrieving and deleting files', { timeout, retry }, async () => {
        await using resource = await createStorageService();

        const { storageServices } = resource;

        // Save the file
        const storageContext = await storageServices.saveFile({
          fileName: 'test.txt',
          mimeType: 'text/plain',
          storageKey: 'files/test.txt',
          fileStream: createReadableStream({ content: 'Hello, world!' }),
        });

        // Retrieve the file
        const { fileStream } = await storageServices.getFileStream({ ...storageContext, storageKey: 'files/test.txt' });
        expect(await collectReadableStreamToString({ stream: fileStream })).to.eql('Hello, world!');

        // Check that the file exists
        expect(await storageServices.fileExists({ storageKey: 'files/test.txt' })).to.eql(true);

        // Try to save another file with the same storage key and expect an error
        await expect(storageServices.saveFile({
          fileName: 'test.txt',
          mimeType: 'text/plain',
          storageKey: 'files/test.txt',
          fileStream: createReadableStream({ content: 'Lorem ipsum' }),
        })).rejects.toThrow(createFileAlreadyExistsInStorageError());

        // Ensure that the original file is still intact after the failed attempt to overwrite it
        const { fileStream: fileStreamAfterError } = await storageServices.getFileStream({ ...storageContext, storageKey: 'files/test.txt' });
        expect(await collectReadableStreamToString({ stream: fileStreamAfterError })).to.eql('Hello, world!');

        // Delete the file
        await storageServices.deleteFile({ storageKey: 'files/test.txt' });
        await expect(storageServices.getFileStream({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());

        // Check that the file no longer exists
        expect(await storageServices.fileExists({ storageKey: 'files/test.txt' })).to.eql(false);

        // Try to delete the file again
        await expect(storageServices.deleteFile({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });
  });
}
