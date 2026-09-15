import type { StorageDriver, StorageDriverFactory, StorageService } from './drivers/drivers.models';
import type {
  StorageConfig,
  StorageDriverOptions,
  StorageEncryptionOptions,
} from './storage.types';
import { AZ_BLOB_STORAGE_DRIVER_NAME } from './drivers/az-blob/az-blob.storage-driver';
import { FS_STORAGE_DRIVER_NAME } from './drivers/fs/fs.storage-driver';
import { IN_MEMORY_STORAGE_DRIVER_NAME } from './drivers/memory/memory.storage-driver';
import { S3_STORAGE_DRIVER_NAME } from './drivers/s3/s3.storage-driver';
import type {
  StorageDriverName,
  StorageDriverOptionsByName,
} from './drivers/storage-drivers.registry';
import { getStorageDriverFactory } from './drivers/storage-drivers.registry';
import { wrapWithEncryptionLayer } from './encryption/storage-encryption.services';

export type { StorageService } from './drivers/drivers.models';

type StorageDriverOptionsResolvers = {
  [TName in StorageDriverName]: (storageConfig: StorageConfig) => StorageDriverOptionsByName[TName];
};

const storageDriverOptionsResolvers = {
  [FS_STORAGE_DRIVER_NAME]: (storageConfig) => storageConfig.drivers.filesystem,
  [S3_STORAGE_DRIVER_NAME]: (storageConfig) => storageConfig.drivers.s3,
  [IN_MEMORY_STORAGE_DRIVER_NAME]: () => undefined,
  [AZ_BLOB_STORAGE_DRIVER_NAME]: (storageConfig) => storageConfig.drivers.azureBlob,
} satisfies StorageDriverOptionsResolvers;

export function createStorageService({
  storageConfig,
  encryptionOptions,
}: {
  storageConfig: StorageConfig;
  encryptionOptions: StorageEncryptionOptions;
}): StorageService {
  const { driver: driverName } = storageConfig;
  const storageDriverFactory = getStorageDriverFactory({
    driverName,
  }) as StorageDriverFactory<StorageDriverOptions>;

  const resolveDriverOptions = storageDriverOptionsResolvers[driverName];
  const driverOptions: StorageDriverOptions = resolveDriverOptions(storageConfig);
  const storageDriver = storageDriverFactory(driverOptions);

  return createStorageServiceFromDriver({ storageDriver, encryptionOptions });
}

export function createStorageServiceFromDriver({
  storageDriver,
  encryptionOptions,
}: {
  storageDriver: StorageDriver;
  encryptionOptions: StorageEncryptionOptions;
}): StorageService {
  return wrapWithEncryptionLayer({ storageDriver, encryptionOptions });
}
