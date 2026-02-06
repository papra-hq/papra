import type { Buffer } from 'node:buffer';
import { collectReadableStreamToBuffer, createReadableStream } from '../../../../shared/streams/readable-stream';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const IN_MEMORY_STORAGE_DRIVER_NAME = 'in-memory' as const;

export const inMemoryStorageDriverFactory = defineStorageDriver(() => {
  const storage: Map<string, { content: Buffer; mimeType: string; fileName: string }> = new Map();

  const fileExists = async ({ storageKey }: { storageKey: string }) => {
    return storage.has(storageKey);
  };

  return {
    name: IN_MEMORY_STORAGE_DRIVER_NAME,

    saveFile: async ({ fileStream, storageKey, mimeType, fileName }) => {
      const content = await collectReadableStreamToBuffer({ stream: fileStream });

      storage.set(storageKey, { content, mimeType, fileName });

      return { storageKey };
    },

    getFileStream: async ({ storageKey }) => {
      const fileEntry = storage.get(storageKey);

      if (!fileEntry) {
        throw createFileNotFoundError();
      }

      return {
        fileStream: createReadableStream({ content: fileEntry.content }),
      };
    },

    deleteFile: async ({ storageKey }) => {
      const exists = await fileExists({ storageKey });

      if (!exists) {
        throw createFileNotFoundError();
      }

      storage.delete(storageKey);
    },

    fileExists,

    _getStorage: () => storage,
  };
});
