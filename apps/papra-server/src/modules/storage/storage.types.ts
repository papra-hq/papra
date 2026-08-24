import type { Buffer } from 'node:buffer';
import type { StorageDriverName } from './drivers/storage-drivers.registry';

export type FilesystemStorageDriverOptions = {
  root: string;
};

export type S3StorageDriverOptions = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
};

export type AzureBlobStorageDriverOptions = {
  connectionString?: string;
  accountName: string;
  accountKey: string;
  containerName: string;
};

export type StorageDriverOptions =
  | FilesystemStorageDriverOptions
  | S3StorageDriverOptions
  | AzureBlobStorageDriverOptions
  | undefined;

export type StorageConfig = {
  driver: StorageDriverName;
  drivers: {
    filesystem: FilesystemStorageDriverOptions;
    s3: S3StorageDriverOptions;
    azureBlob: AzureBlobStorageDriverOptions;
  };
};

export type StorageKeyEncryptionKey = {
  version: string;
  key: Buffer;
};

export type StorageEncryptionOptions = {
  isEncryptionEnabled: boolean;
  keyEncryptionKeys?: StorageKeyEncryptionKey[];
};
