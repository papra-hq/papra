import fs from 'node:fs';
import { dirname } from 'node:path';
import stream from 'node:stream';
import { defineStorageDriver } from '../drivers.models';
import { createFileAlreadyExistsError } from './fs.storage-driver.errors';

function ensureDirectoryExists({ path }: { path: string }) {
  return fs.promises.mkdir(
    dirname(path),
    { recursive: true },
  );
}

function checkFileExists({ path }: { path: string }) {
  return fs.promises.access(path, fs.constants.F_OK).then(() => true).catch(() => false);
}

export const FS_STORAGE_DRIVER_NAME = 'filesystem' as const;

export const fsStorageDriverFactory = defineStorageDriver(async ({ config }) => {
  const { root } = config.documentsStorage.drivers.filesystem;

  await ensureDirectoryExists({ path: root });

  return {
    name: FS_STORAGE_DRIVER_NAME,
    saveFile: async ({ fileStream, fileName }) => {
      // Save file to disk
      const storageKey = `${root}/${fileName}`;

      const fileExists = await checkFileExists({ path: storageKey });

      if (fileExists) {
        throw createFileAlreadyExistsError();
      }

      await ensureDirectoryExists({ path: storageKey });

      const writeStream = fs.createWriteStream(storageKey);
      stream.Readable.fromWeb(fileStream).pipe(writeStream);

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({ storageKey });
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      });
    },
  };
});
