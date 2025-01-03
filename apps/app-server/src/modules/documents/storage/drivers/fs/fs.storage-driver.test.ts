import type { Config } from '../../../../config/config.types';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import stream from 'node:stream';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
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
        const fileStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'text-file.txt'));

        const { storageKey } = await fsStorageDriver.saveFile({
          fileStream: stream.Readable.toWeb(fileStream),
          fileName: 'text-file.txt',
        });

        expect(storageKey).to.eql(`${tmpDirectory}/text-file.txt`);

        const fileExists = await fs.promises.access(storageKey, fs.constants.F_OK).then(() => true).catch(() => false);

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
        const fileStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'text-file.txt'));

        await fsStorageDriver.saveFile({
          fileStream: stream.Readable.toWeb(fileStream),
          fileName: 'text-file.txt',
        });

        await expect(
          fsStorageDriver.saveFile({
            fileStream: stream.Readable.toWeb(fileStream),
            fileName: 'text-file.txt',
          }),
        ).rejects.toThrow(createFileAlreadyExistsError());
      });
    });
  });
});
