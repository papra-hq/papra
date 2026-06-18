import type { StorageDriver, StorageServices } from './drivers.models';
import { Buffer } from 'node:buffer';
import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  collectReadableStreamToBuffer,
  collectReadableStreamToString,
  createReadableStream,
} from '../../../shared/streams/readable-stream';
import {
  createFileAlreadyExistsInStorageError,
  createFileNotFoundError,
} from '../document-storage.errors';
import { wrapWithEncryptionLayer } from '../encryption/document-encryption.services';
import { IN_BYTES } from '../../../shared/units';
import { MULTIPART_MIN_PART_SIZE_IN_BYTES } from './s3/s3.storage-driver';

export function runDriverTestSuites({
  createDriver: createDriverBase,
  timeout,
  retry,
}: {
  createDriver: () => Promise<{
    driver: StorageDriver;
    [Symbol.asyncDispose]: () => Promise<void>;
  }>;
  timeout?: number;
  retry?: number;
}) {
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
                {
                  version: '1',
                  key: Buffer.from(
                    '622b55bec85b3fca6fbad2d1c5ef1d67ed19b24eece069961cd430370735c2ff',
                    'hex',
                  ),
                },
              ],
            },
          }),
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
  ].forEach(({ createStorageService, name }) => {
    describe.concurrent(name, () => {
      test(
        'the driver should support uploading, retrieving and deleting files',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();

          const { storageServices } = resource;

          // Use a unique key per run so suites that share a real backend (e.g. a live R2/B2 bucket)
          // don't collide. With isolated localstack containers this just adds harmless entropy.
          const storageKey = `files/${randomUUID()}.txt`;

          // Save the file
          const storageContext = await storageServices.saveFile({
            fileName: 'test.txt',
            mimeType: 'text/plain',
            storageKey,
            fileStream: createReadableStream({ content: 'Hello, world!' }),
          });

          // Retrieve the file
          const { fileStream } = await storageServices.getFileStream({
            ...storageContext,
            storageKey,
          });
          expect(await collectReadableStreamToString({ stream: fileStream })).to.eql(
            'Hello, world!',
          );

          // Check that the file exists
          expect(await storageServices.fileExists({ storageKey })).to.eql(true);

          // Try to save another file with the same storage key and expect an error
          await expect(
            storageServices.saveFile({
              fileName: 'test.txt',
              mimeType: 'text/plain',
              storageKey,
              fileStream: createReadableStream({ content: 'Lorem ipsum' }),
            }),
          ).rejects.toThrow(createFileAlreadyExistsInStorageError());

          // Ensure that the original file is still intact after the failed attempt to overwrite it
          const { fileStream: fileStreamAfterError } = await storageServices.getFileStream({
            ...storageContext,
            storageKey,
          });
          expect(await collectReadableStreamToString({ stream: fileStreamAfterError })).to.eql(
            'Hello, world!',
          );

          // Delete the file
          await storageServices.deleteFile({ storageKey });
          await expect(storageServices.getFileStream({ storageKey })).rejects.toThrow(
            createFileNotFoundError(),
          );

          // Check that the file no longer exists
          expect(await storageServices.fileExists({ storageKey })).to.eql(false);

          // Try to delete the file again
          await expect(storageServices.deleteFile({ storageKey })).rejects.toThrow(
            createFileNotFoundError(),
          );
        },
      );

      test(
        'the driver should support uploading and retrieving large files',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();

          const { storageServices } = resource;

          const storageKey = `files/${randomUUID()}.bin`;
          // Larger than the s3 driver's 8MB single-PUT threshold, so the upload goes through the
          // multipart path. Random bytes so a corrupted or mis-ordered part would fail the comparison.
          const documentSizeInBytes = 9 * IN_BYTES.MEGABYTE;
          expect.assert(documentSizeInBytes > MULTIPART_MIN_PART_SIZE_IN_BYTES);
          const content = randomBytes(documentSizeInBytes);

          const storageContext = await storageServices.saveFile({
            fileName: 'large.bin',
            mimeType: 'application/octet-stream',
            storageKey,
            fileStream: createReadableStream({ content }),
          });

          const { fileStream } = await storageServices.getFileStream({
            ...storageContext,
            storageKey,
          });
          const retrieved = await collectReadableStreamToBuffer({ stream: fileStream });

          expect(retrieved.length).to.eql(content.length);
          expect(retrieved.equals(content)).to.eql(true);

          await storageServices.deleteFile({ storageKey });
        },
      );
    });
  });
}
