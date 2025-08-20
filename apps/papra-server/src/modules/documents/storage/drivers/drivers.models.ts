import type { Readable } from 'node:stream';
import type { Config } from '../../../config/config.types';

export type StorageDriver = {
  name: string;
  saveFile: (args: {
    fileStream: Readable;
    fileName: string;
    mimeType: string;
    storageKey: string;
  }) => Promise<{ storageKey: string }>;

  getFileStream: (args: { storageKey: string }) => Promise<{
    fileStream: Readable;
  }>;

  deleteFile: (args: { storageKey: string }) => Promise<void>;
};

export type StorageDriverFactory = (args: { config: Config }) => StorageDriver;

export function defineStorageDriver<T extends StorageDriverFactory>(factory: T) {
  return factory;
}
