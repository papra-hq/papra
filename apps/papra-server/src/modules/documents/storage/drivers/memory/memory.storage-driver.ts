import type { Buffer } from 'node:buffer';
import { collectReadableStreamToBuffer, createReadableStream } from '../../../../shared/streams/readable-stream';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const IN_MEMORY_STORAGE_DRIVER_NAME = 'in-memory' as const;

export const inMemoryStorageDriverFactory = defineStorageDriver(() => {
  const storage: Map<string, { content: Buffer; mimeType: string; fileName: string }> = new Map();

  const fileExists = ({ storageKey }: { storageKey: string }) => storage.has(storageKey);

  return {
    name: IN_MEMORY_STORAGE_DRIVER_NAME,

    saveFile: async ({ fileStream, storageKey, mimeType, fileName }) => {
      if (fileExists({ storageKey })) {
        throw createFileAlreadyExistsInStorageError();
      }

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
      if (!fileExists({ storageKey })) {
        throw createFileNotFoundError();
      }

      storage.delete(storageKey);
    },

    fileExists: async ({ storageKey }) => fileExists({ storageKey }),

    _getStorage: () => storage,
  };
});
