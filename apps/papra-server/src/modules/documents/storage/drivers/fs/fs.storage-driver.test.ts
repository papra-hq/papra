import type { Config } from '../../../../config/config.types';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
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

        const { storageKey } = await fsStorageDriver.saveFile({
          file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
          organizationId: 'org_1',
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
          organizationId: 'org_1',
        });

        await expect(
          fsStorageDriver.saveFile({
            file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
            organizationId: 'org_1',
          }),
        ).rejects.toThrow(createFileAlreadyExistsError());
      });
    });
  });
});
