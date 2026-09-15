import type { StorageDriver, StorageService } from './drivers.models';
import { Buffer } from 'node:buffer';
import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  collectReadableStreamToBuffer,
  collectReadableStreamToString,
  createReadableStream,
} from '../../shared/streams/readable-stream';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../storage.errors';
import { wrapWithEncryptionLayer } from '../encryption/storage-encryption.services';
import { IN_BYTES } from '../../shared/units';
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
  const createDriver = async () => {
    const { driver, [Symbol.asyncDispose]: dispose } = await createDriverBase();
    const storageKeys = new Set<string>();

    return {
      driver: {
        ...driver,
        saveFile: async (args) => {
          storageKeys.add(args.storageKey);
          await driver.saveFile(args);
        },
        copyFile: async (args) => {
          storageKeys.add(args.destinationStorageKey);
          await driver.copyFile(args);
        },
      } satisfies StorageDriver,
      [Symbol.asyncDispose]: async () => {
        try {
          // Clean up even after failed assertions, including on shared live R2/B2 backends.
          const results = await Promise.allSettled(
            [...storageKeys].map(async (storageKey) => {
              if (await driver.fileExists({ storageKey })) {
                await driver.deleteFile({ storageKey });
              }
            }),
          );
          const errors = results
            .filter((result) => result.status === 'rejected')
            .map((result) => result.reason);

          if (errors.length > 0) {
            throw new AggregateError(errors, 'Failed to clean up storage test files');
          }
        } finally {
          await dispose();
        }
      },
    };
  };

  [
    {
      name: 'without encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriver();

        return {
          storageServices: {
            ...driver,
            saveFile: async (args) => {
              await driver.saveFile(args);
              return {};
            },
          } as StorageService,
          [Symbol.asyncDispose]: dispose,
        };
      },
    },
    {
      name: 'with encryption',
      createStorageService: async () => {
        const { driver, [Symbol.asyncDispose]: dispose } = await createDriver();

        return {
          storageServices: wrapWithEncryptionLayer({
            storageDriver: driver,
            encryptionOptions: {
              isEncryptionEnabled: true,
              keyEncryptionKeys: [
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
        'copies to a nested key and remains readable after deleting the source',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();
          const { storageServices } = resource;
          const prefix = `files/${randomUUID()}`;
          const sourceStorageKey = `${prefix}/source.bin`;
          const destinationStorageKey = `${prefix}/nested/destination.bin`;
          const content = randomBytes(2_048);
          const encryptionContext = await storageServices.saveFile({
            storageKey: sourceStorageKey,
            fileName: 'source.bin',
            mimeType: 'application/octet-stream',
            fileStream: createReadableStream({ content }),
          });

          await storageServices.copyFile({ sourceStorageKey, destinationStorageKey });

          const { fileStream: destinationStream } = await storageServices.getFileStream({
            storageKey: destinationStorageKey,
            ...encryptionContext,
          });
          expect(await collectReadableStreamToBuffer({ stream: destinationStream })).toEqual(
            content,
          );

          const { fileStream: sourceStream } = await storageServices.getFileStream({
            storageKey: sourceStorageKey,
            ...encryptionContext,
          });
          expect(await collectReadableStreamToBuffer({ stream: sourceStream })).toEqual(content);

          await storageServices.deleteFile({ storageKey: sourceStorageKey });
          expect(await storageServices.fileExists({ storageKey: sourceStorageKey })).toEqual(false);

          const { fileStream } = await storageServices.getFileStream({
            storageKey: destinationStorageKey,
            ...encryptionContext,
          });
          expect(await collectReadableStreamToBuffer({ stream: fileStream })).toEqual(content);
        },
      );

      test(
        'rejects a missing copy source without creating a destination',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();
          const { storageServices } = resource;
          const prefix = `files/${randomUUID()}`;
          const sourceStorageKey = `${prefix}/missing.txt`;
          const destinationStorageKey = `${prefix}/nested/destination.txt`;

          await expect(
            storageServices.copyFile({ sourceStorageKey, destinationStorageKey }),
          ).rejects.toThrow(createFileNotFoundError());

          expect(await storageServices.fileExists({ storageKey: sourceStorageKey })).toEqual(false);
          expect(await storageServices.fileExists({ storageKey: destinationStorageKey })).toEqual(
            false,
          );
        },
      );

      test(
        'rejects an existing copy destination and preserves both files',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();
          const { storageServices } = resource;
          const prefix = `files/${randomUUID()}`;
          const sourceStorageKey = `${prefix}/source.txt`;
          const destinationStorageKey = `${prefix}/destination.txt`;
          const sourceContext = await storageServices.saveFile({
            storageKey: sourceStorageKey,
            fileName: 'source.txt',
            mimeType: 'text/plain',
            fileStream: createReadableStream({ content: 'source content' }),
          });
          const destinationContext = await storageServices.saveFile({
            storageKey: destinationStorageKey,
            fileName: 'destination.txt',
            mimeType: 'text/plain',
            fileStream: createReadableStream({ content: 'destination content' }),
          });

          await expect(
            storageServices.copyFile({ sourceStorageKey, destinationStorageKey }),
          ).rejects.toThrow(createFileAlreadyExistsInStorageError());

          const { fileStream: sourceStream } = await storageServices.getFileStream({
            storageKey: sourceStorageKey,
            ...sourceContext,
          });
          expect(await collectReadableStreamToString({ stream: sourceStream })).toEqual(
            'source content',
          );
          const { fileStream: destinationStream } = await storageServices.getFileStream({
            storageKey: destinationStorageKey,
            ...destinationContext,
          });
          expect(await collectReadableStreamToString({ stream: destinationStream })).toEqual(
            'destination content',
          );
        },
      );

      test('rejects copying an existing key onto itself', { timeout, retry }, async () => {
        await using resource = await createStorageService();
        const { storageServices } = resource;
        const storageKey = `files/${randomUUID()}.txt`;
        const encryptionContext = await storageServices.saveFile({
          storageKey,
          fileName: 'source.txt',
          mimeType: 'text/plain',
          fileStream: createReadableStream({ content: 'original content' }),
        });

        await expect(
          storageServices.copyFile({
            sourceStorageKey: storageKey,
            destinationStorageKey: storageKey,
          }),
        ).rejects.toThrow(createFileAlreadyExistsInStorageError());

        const { fileStream } = await storageServices.getFileStream({
          storageKey,
          ...encryptionContext,
        });
        expect(await collectReadableStreamToString({ stream: fileStream })).toEqual(
          'original content',
        );
      });

      test(
        'copies keys containing spaces, Unicode, and URL-reserved characters',
        { timeout, retry },
        async () => {
          await using resource = await createStorageService();
          const { storageServices } = resource;
          const prefix = `files/${randomUUID()}`;
          const sourceStorageKey = `${prefix}/dossier été/文档 + #%.txt`;
          const destinationStorageKey = `${prefix}/copie été/資料 + #%.txt`;
          const encryptionContext = await storageServices.saveFile({
            storageKey: sourceStorageKey,
            fileName: 'source.txt',
            mimeType: 'text/plain',
            fileStream: createReadableStream({ content: 'été 文档' }),
          });

          await storageServices.copyFile({ sourceStorageKey, destinationStorageKey });

          const { fileStream } = await storageServices.getFileStream({
            storageKey: destinationStorageKey,
            ...encryptionContext,
          });
          expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('été 文档');
        },
      );

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
