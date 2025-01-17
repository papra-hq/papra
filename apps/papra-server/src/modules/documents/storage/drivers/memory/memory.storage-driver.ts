import { defineStorageDriver } from '../drivers.models';

export const IN_MEMORY_STORAGE_DRIVER_NAME = 'in-memory' as const;

export const inMemoryStorageDriverFactory = defineStorageDriver(async () => {
  const storage: Map<string, File> = new Map();

  return {
    name: IN_MEMORY_STORAGE_DRIVER_NAME,

    saveFile: async ({ file, storageKey }) => {
      storage.set(storageKey, file);

      return { storageKey };
    },

    getFileStream: async ({ storageKey }) => {
      const fileEntry = storage.get(storageKey);

      if (!fileEntry) {
        throw new Error('File not found');
      }

      return {
        fileStream: fileEntry.stream(),
      };
    },

    deleteFile: async ({ storageKey }) => {
      storage.delete(storageKey);
    },
  };
});
