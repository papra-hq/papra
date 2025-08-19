import { Readable } from 'node:stream';
import { collectStreamToFile } from '../../../../shared/streams/stream.convertion';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const IN_MEMORY_STORAGE_DRIVER_NAME = 'in-memory' as const;

export const inMemoryStorageDriverFactory = defineStorageDriver(async () => {
  const storage: Map<string, File> = new Map();

  return {
    name: IN_MEMORY_STORAGE_DRIVER_NAME,

    saveFile: async ({ fileStream, storageKey, mimeType, fileName }) => {
      const { file } = await collectStreamToFile({ fileStream, fileName, mimeType });

      storage.set(storageKey, file);

      return { storageKey };
    },

    getFileStream: async ({ storageKey }) => {
      const fileEntry = storage.get(storageKey);

      if (!fileEntry) {
        throw createFileNotFoundError();
      }

      return {
        fileStream: Readable.from(fileEntry.stream()),
      };
    },

    deleteFile: async ({ storageKey }) => {
      if (!storage.has(storageKey)) {
        throw createFileNotFoundError();
      }

      storage.delete(storageKey);
    },

    _getStorage: () => storage,
  };
});
