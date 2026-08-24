import type { Readable } from 'node:stream';
import type { ExtendNamedArguments, ExtendReturnPromise } from '../../shared/types';

export type StorageDriver = {
  name: string;
  saveFile: (args: {
    fileStream: Readable;
    fileName: string;
    mimeType: string;
    storageKey: string;
  }) => Promise<void>;

  getFileStream: (args: { storageKey: string }) => Promise<{
    fileStream: Readable;
  }>;

  deleteFile: (args: { storageKey: string }) => Promise<void>;
  fileExists: (args: { storageKey: string }) => Promise<boolean>;
};

export type EncryptionContext = {
  fileEncryptionKeyWrapped?: string | null | undefined;
  fileEncryptionAlgorithm?: string | null | undefined;
  fileEncryptionKekVersion?: string | null | undefined;
};

export type StorageService = {
  saveFile: ExtendReturnPromise<StorageDriver['saveFile'], EncryptionContext>;
  getFileStream: ExtendNamedArguments<StorageDriver['getFileStream'], EncryptionContext>;
  deleteFile: StorageDriver['deleteFile'];
  fileExists: StorageDriver['fileExists'];
};

export type StorageDriverFactory<TOptions = undefined> = (options: TOptions) => StorageDriver;
