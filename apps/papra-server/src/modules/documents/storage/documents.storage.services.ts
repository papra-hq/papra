import type { Config } from '../../config/config.types';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { AZ_BLOB_STORAGE_DRIVER_NAME, azBlobStorageDriverFactory } from './drivers/az-blob/az-blob.storage-driver';
import { B2_STORAGE_DRIVER_NAME, b2StorageDriverFactory } from './drivers/b2/b2.storage-driver';
import { FS_STORAGE_DRIVER_NAME, fsStorageDriverFactory } from './drivers/fs/fs.storage-driver';
import { IN_MEMORY_STORAGE_DRIVER_NAME, inMemoryStorageDriverFactory } from './drivers/memory/memory.storage-driver';
import { S3_STORAGE_DRIVER_NAME, s3StorageDriverFactory } from './drivers/s3/s3.storage-driver';

const storageDriverFactories = {
  [FS_STORAGE_DRIVER_NAME]: fsStorageDriverFactory,
  [S3_STORAGE_DRIVER_NAME]: s3StorageDriverFactory,
  [IN_MEMORY_STORAGE_DRIVER_NAME]: inMemoryStorageDriverFactory,
  [AZ_BLOB_STORAGE_DRIVER_NAME]: azBlobStorageDriverFactory,
  [B2_STORAGE_DRIVER_NAME]: b2StorageDriverFactory,
};

export type DocumentStorageService = Awaited<ReturnType<typeof createDocumentStorageService>>;

export async function createDocumentStorageService({ config }: { config: Config }) {
  const storageDriverName = config.documentsStorage.driver;

  const storageDriverFactory = storageDriverFactories[storageDriverName];

  if (isNil(storageDriverFactory)) {
    throw createError({
      message: `Unknown storage driver: ${storageDriverName}`,
      code: 'storage_driver.unknown_driver',
      isInternal: true,
      statusCode: 500,
    });
  }

  const storageDriver = await storageDriverFactory({ config });

  return storageDriver;
}
