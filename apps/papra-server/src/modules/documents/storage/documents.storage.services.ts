import type { Config } from '../../config/config.types';
import type { DocumentStorageConfig } from './documents.storage.types';
import type { StorageDriver, StorageDriverFactory, StorageServices } from './drivers/drivers.models';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { AZ_BLOB_STORAGE_DRIVER_NAME, azBlobStorageDriverFactory } from './drivers/az-blob/az-blob.storage-driver';
import { FS_STORAGE_DRIVER_NAME, fsStorageDriverFactory } from './drivers/fs/fs.storage-driver';
import { IN_MEMORY_STORAGE_DRIVER_NAME, inMemoryStorageDriverFactory } from './drivers/memory/memory.storage-driver';
import { S3_STORAGE_DRIVER_NAME, s3StorageDriverFactory } from './drivers/s3/s3.storage-driver';
import { wrapWithEncryptionLayer } from './encryption/document-encryption.services';

const storageDriverFactories = {
  [FS_STORAGE_DRIVER_NAME]: fsStorageDriverFactory,
  [S3_STORAGE_DRIVER_NAME]: s3StorageDriverFactory,
  [IN_MEMORY_STORAGE_DRIVER_NAME]: inMemoryStorageDriverFactory,
  [AZ_BLOB_STORAGE_DRIVER_NAME]: azBlobStorageDriverFactory,
};

export type DocumentStorageService = Awaited<ReturnType<typeof createDocumentStorageService>>;

export function createDocumentStorageService({ documentStorageConfig }: { documentStorageConfig: DocumentStorageConfig }): StorageServices {
  const storageDriverName = documentStorageConfig.driver;

  const storageDriverFactory: StorageDriverFactory | undefined = storageDriverFactories[storageDriverName];

  if (isNil(storageDriverFactory)) {
    throw createError({
      message: `Unknown storage driver: ${storageDriverName}`,
      code: 'storage_driver.unknown_driver',
      isInternal: true,
      statusCode: 500,
    });
  }

  const storageDriver = storageDriverFactory({ documentStorageConfig });

  return createDocumentStorageServiceFromDriver({
    storageDriver,
    encryptionConfig: documentStorageConfig.encryption,
  });
}

export function createDocumentStorageServiceFromDriver({
  storageDriver,
  encryptionConfig,
}: {
  storageDriver: StorageDriver;
  encryptionConfig: Config['documentsStorage']['encryption'];
}): StorageServices {
  return wrapWithEncryptionLayer({ storageDriver, encryptionConfig });
}
