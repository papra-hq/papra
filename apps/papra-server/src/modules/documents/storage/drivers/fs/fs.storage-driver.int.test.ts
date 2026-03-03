import type { DocumentStorageConfig } from '../../documents.storage.types';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createDisposableTmpDirectory } from '../../../../shared/fs/fs.test-utils';
import { createReadableStream } from '../../../../shared/streams/readable-stream';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../../document-storage.errors';
import { runDriverTestSuites } from '../drivers.test-suite';
import { fsStorageDriverFactory } from './fs.storage-driver';

describe('storage driver', () => {
  describe('fsStorageDriver', async () => {
    runDriverTestSuites({
      createDriver: async () => {
        const { tmpDirectoryPath, removeTmpDirectory } = await createDisposableTmpDirectory();

        return {
          driver: fsStorageDriverFactory({
            documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig,
          }),
          [Symbol.asyncDispose]: async () => {
            await removeTmpDirectory();
          },
        };
      },
    });

    describe('saveFile', () => {
      test('persists the file to the filesystem', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });
        const storageKey = 'org_1/text-file.txt';

        await fsStorageDriver.saveFile({
          fileStream: createReadableStream({ content: 'lorem ipsum' }),
          fileName: 'text-file.txt',
          mimeType: 'text/plain',
          storageKey,
        });

        const storagePath = path.join(tmpDirectoryPath, storageKey);

        const fileExists = await fs.promises.access(storagePath, fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileExists).to.eql(true);
      });

      test('an error is raised if the file already exists', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });

        await fsStorageDriver.saveFile({
          fileStream: createReadableStream({ content: 'lorem ipsum' }),
          fileName: 'text-file.txt',
          mimeType: 'text/plain',
          storageKey: 'org_1/text-file.txt',
        });

        await expect(
          fsStorageDriver.saveFile({
            fileStream: createReadableStream({ content: 'lorem ipsum' }),
            fileName: 'text-file.txt',
            mimeType: 'text/plain',
            storageKey: 'org_1/text-file.txt',
          }),
        ).rejects.toThrow(createFileAlreadyExistsInStorageError());
      });
    });

    describe('getFileStream', () => {
      test('get a readable stream of a stored file', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });

        await fsStorageDriver.saveFile({
          fileStream: createReadableStream({ content: 'lorem ipsum' }),
          fileName: 'text-file.txt',
          mimeType: 'text/plain',
          storageKey: 'org_1/text-file.txt',
        });

        const { fileStream } = await fsStorageDriver.getFileStream({ storageKey: 'org_1/text-file.txt' });

        const chunks: unknown[] = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }

        expect(chunks).to.eql([new TextEncoder().encode('lorem ipsum')]);
      });

      test('an error is raised if the file does not exist', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });

        await expect(fsStorageDriver.getFileStream({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });

    describe('deleteFile', () => {
      test('deletes a stored file', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });

        await fsStorageDriver.saveFile({
          fileStream: createReadableStream({ content: 'lorem ipsum' }),
          fileName: 'text-file.txt',
          mimeType: 'text/plain',
          storageKey: 'org_1/text-file.txt',
        });

        const fileInitiallyExists = await fs.promises.access(path.join(tmpDirectoryPath, 'org_1/text-file.txt'), fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileInitiallyExists).to.eql(true);

        await fsStorageDriver.deleteFile({ storageKey: 'org_1/text-file.txt' });

        const storagePath = path.join(tmpDirectoryPath, 'org_1/text-file.txt');
        const fileExists = await fs.promises.access(storagePath, fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileExists).to.eql(false);
      });

      test('when the file does not exist, an error is raised', async () => {
        await using tmpDirectory = await createDisposableTmpDirectory();
        const { tmpDirectoryPath } = tmpDirectory;

        const fsStorageDriver = fsStorageDriverFactory({ documentStorageConfig: { drivers: { filesystem: { root: tmpDirectoryPath } } } as DocumentStorageConfig });

        await expect(fsStorageDriver.deleteFile({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });
  });
});
