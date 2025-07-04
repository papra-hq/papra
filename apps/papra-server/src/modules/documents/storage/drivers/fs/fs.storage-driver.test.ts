import type { Config } from '../../../../config/config.types';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createFileNotFoundError } from '../../document-storage.errors';
import { fsStorageDriverFactory } from './fs.storage-driver';
import { createFileAlreadyExistsError } from './fs.storage-driver.errors';

describe('storage driver', () => {
  describe('fsStorageDriver', async () => {
    let tmpDirectory: string;

    beforeEach(async () => {
      tmpDirectory = await fs.promises.mkdtemp(join(tmpdir(), 'tests-'));
    });

    afterEach(async () => {
      await fs.promises.rm(tmpDirectory, { recursive: true });
    });

    describe('saveFile', () => {
      test('persists the file to the filesystem', async () => {
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        const { storageKey } = await fsStorageDriver.saveFile({
          file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
          storageKey: 'org_1/text-file.txt',
        });

        expect(storageKey).to.eql(`org_1/text-file.txt`);
        const storagePath = path.join(tmpDirectory, storageKey);

        const fileExists = await fs.promises.access(storagePath, fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileExists).to.eql(true);
      });

      test('an error is raised if the file already exists', async () => {
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        await fsStorageDriver.saveFile({
          file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
          storageKey: 'org_1/text-file.txt',
        });

        await expect(
          fsStorageDriver.saveFile({
            file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
            storageKey: 'org_1/text-file.txt',
          }),
        ).rejects.toThrow(createFileAlreadyExistsError());
      });
    });

    describe('getFileStream', () => {
      test('get a readable stream of a stored file', async () => {
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        await fsStorageDriver.saveFile({
          file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
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
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        await expect(fsStorageDriver.getFileStream({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });

    describe('deleteFile', () => {
      test('deletes a stored file', async () => {
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        await fsStorageDriver.saveFile({
          file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
          storageKey: 'org_1/text-file.txt',
        });

        const fileInitiallyExists = await fs.promises.access(path.join(tmpDirectory, 'org_1/text-file.txt'), fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileInitiallyExists).to.eql(true);

        await fsStorageDriver.deleteFile({ storageKey: 'org_1/text-file.txt' });

        const storagePath = path.join(tmpDirectory, 'org_1/text-file.txt');
        const fileExists = await fs.promises.access(storagePath, fs.constants.F_OK).then(() => true).catch(() => false);

        expect(fileExists).to.eql(false);
      });

      test('when the file does not exist, an error is raised', async () => {
        const config = {
          documentsStorage: {
            drivers: {
              filesystem: {
                root: tmpDirectory,
              },
            },
          },
        } as Config;

        const fsStorageDriver = await fsStorageDriverFactory({ config });

        await expect(fsStorageDriver.deleteFile({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow(createFileNotFoundError());
      });
    });
  });
});
