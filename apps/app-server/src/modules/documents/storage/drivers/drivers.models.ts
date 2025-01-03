import type { Config } from '../../../config/config.types';

export type StorageDriver = {
  name: string;
  saveFile: (args: { fileStream: ReadableStream; fileName: string }) => Promise<{ storageKey: string }>;
};

export type StorageDriverFactory = (args: { config: Config }) => Promise<StorageDriver>;

export function defineStorageDriver(factory: StorageDriverFactory) {
  return factory;
}
