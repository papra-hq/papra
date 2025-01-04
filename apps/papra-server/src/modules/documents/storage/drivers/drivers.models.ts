import type { ReadableStream } from 'node:stream/web';
import type { Config } from '../../../config/config.types';

export type StorageDriver = {
  name: string;
  saveFile: (args: {
    file: File;
    organizationId: string;
  }) => Promise<{ storageKey: string }>;

  getFileStream: (args: { storageKey: string }) => Promise<{
    fileStream: ReadableStream;
  }>;
};

export type StorageDriverFactory = (args: { config: Config }) => Promise<StorageDriver>;

export function defineStorageDriver(factory: StorageDriverFactory) {
  return factory;
}
