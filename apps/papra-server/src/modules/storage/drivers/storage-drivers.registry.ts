import type { StorageDriverFactory } from './drivers.models';
import type {
  AzureBlobStorageDriverOptions,
  FilesystemStorageDriverOptions,
  S3StorageDriverOptions,
} from '../storage.types';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import {
  AZ_BLOB_STORAGE_DRIVER_NAME,
  azBlobStorageDriverFactory,
} from './az-blob/az-blob.storage-driver';
import { FS_STORAGE_DRIVER_NAME, fsStorageDriverFactory } from './fs/fs.storage-driver';
import {
  IN_MEMORY_STORAGE_DRIVER_NAME,
  inMemoryStorageDriverFactory,
} from './memory/memory.storage-driver';
import { S3_STORAGE_DRIVER_NAME, s3StorageDriverFactory } from './s3/s3.storage-driver';

export const storageDriverFactories = {
  [FS_STORAGE_DRIVER_NAME]: fsStorageDriverFactory,
  [S3_STORAGE_DRIVER_NAME]: s3StorageDriverFactory,
  [IN_MEMORY_STORAGE_DRIVER_NAME]: inMemoryStorageDriverFactory,
  [AZ_BLOB_STORAGE_DRIVER_NAME]: azBlobStorageDriverFactory,
};

export const storageDriverNames = Object.keys(
  storageDriverFactories,
) as (keyof typeof storageDriverFactories)[];

export type StorageDriverName = keyof typeof storageDriverFactories;

export type StorageDriverOptionsByName = {
  [FS_STORAGE_DRIVER_NAME]: FilesystemStorageDriverOptions;
  [S3_STORAGE_DRIVER_NAME]: S3StorageDriverOptions;
  [IN_MEMORY_STORAGE_DRIVER_NAME]: undefined;
  [AZ_BLOB_STORAGE_DRIVER_NAME]: AzureBlobStorageDriverOptions;
};

export function getStorageDriverFactory<TName extends StorageDriverName>({
  driverName,
}: {
  driverName: TName;
}): StorageDriverFactory<StorageDriverOptionsByName[TName]> {
  const factory = storageDriverFactories[driverName];

  if (isNil(factory)) {
    throw createError({
      message: `Unknown storage driver: ${driverName}`,
      code: 'storage_driver.unknown_driver',
      isInternal: true,
      statusCode: 500,
    });
  }

  return factory as StorageDriverFactory<StorageDriverOptionsByName[TName]>;
}
