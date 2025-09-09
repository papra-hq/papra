import type { Readable } from 'node:stream';
import type { ExtendNamedArguments, ExtendReturnPromise } from '../../../shared/types';
import type { DocumentStorageConfig } from '../documents.storage.types';

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

export type EncryptionContext = {
  fileEncryptionKeyWrapped?: string | null | undefined;
  fileEncryptionAlgorithm?: string | null | undefined;
  fileEncryptionKekVersion?: string | null | undefined;
};

// Same as the driver but with the encryption context added in the args
export type StorageServices = {
  saveFile: ExtendReturnPromise<StorageDriver['saveFile'], EncryptionContext>;
  getFileStream: ExtendNamedArguments<StorageDriver['getFileStream'], EncryptionContext>;
  deleteFile: StorageDriver['deleteFile'];
};

export type StorageDriverFactory = (args: { documentStorageConfig: DocumentStorageConfig }) => StorageDriver;

export function defineStorageDriver<T extends StorageDriverFactory>(factory: T) {
  return factory;
}
