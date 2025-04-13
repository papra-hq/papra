import fs from 'node:fs';
import { dirname, join } from 'node:path';
import stream from 'node:stream';
import { get } from 'lodash-es';
import { checkFileExists, deleteFile, ensureDirectoryExists } from '../../../../shared/fs/fs.services';
import { defineStorageDriver } from '../drivers.models';
import { createFileAlreadyExistsError } from './fs.storage-driver.errors';

export const FS_STORAGE_DRIVER_NAME = 'filesystem' as const;

export const fsStorageDriverFactory = defineStorageDriver(async ({ config }) => {
  const { root } = config.documentsStorage.drivers.filesystem;

  await ensureDirectoryExists({ path: root });

  const getStoragePath = ({ storageKey }: { storageKey: string }) => ({ storagePath: join(root, storageKey) });

  return {
    name: FS_STORAGE_DRIVER_NAME,
    saveFile: async ({ file, storageKey }) => {
      const { storagePath } = getStoragePath({ storageKey });

      const fileExists = await checkFileExists({ path: storagePath });

      if (fileExists) {
        throw createFileAlreadyExistsError();
      }

      await ensureDirectoryExists({ path: dirname(storagePath) });

      const writeStream = fs.createWriteStream(storagePath);
      stream.Readable.fromWeb(file.stream()).pipe(writeStream);

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({ storageKey });
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      });
    },
    getFileStream: async ({ storageKey }) => {
      const { storagePath } = getStoragePath({ storageKey });

      const fileExists = await checkFileExists({ path: storagePath });

      if (!fileExists) {
        throw new Error('File not found');
      }

      const readStream = fs.createReadStream(storagePath);
      const fileStream = stream.Readable.toWeb(readStream);

      return { fileStream };
    },
    deleteFile: async ({ storageKey }) => {
      const { storagePath } = getStoragePath({ storageKey });

      try {
        await deleteFile({ filePath: storagePath });
      } catch (error) {
        if (get(error, 'code') === 'ENOENT') {
          throw new Error('File not found');
        }

        throw error;
      }
    },
  };
});
