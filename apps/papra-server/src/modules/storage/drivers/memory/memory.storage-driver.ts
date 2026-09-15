import type { StorageDriver } from '../drivers.models';
import { Buffer } from 'node:buffer';
import {
  collectReadableStreamToBuffer,
  createReadableStream,
} from '../../../shared/streams/readable-stream';
import {
  createFileAlreadyExistsInStorageError,
  createFileNotFoundError,
} from '../../storage.errors';

export const IN_MEMORY_STORAGE_DRIVER_NAME = 'in-memory' as const;

export const inMemoryStorageDriverFactory = () => {
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
    },

    copyFile: async ({ sourceStorageKey, destinationStorageKey }) => {
      const source = storage.get(sourceStorageKey);

      if (!source) {
        throw createFileNotFoundError();
      }

      if (fileExists({ storageKey: destinationStorageKey })) {
        throw createFileAlreadyExistsInStorageError();
      }

      storage.set(destinationStorageKey, { ...source, content: Buffer.from(source.content) });
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
  } satisfies StorageDriver & { _getStorage: () => typeof storage };
};
