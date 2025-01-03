import type { Config } from '../../config/config.types';
import type { StorageDriver } from './drivers/drivers.models';
import { injectArguments } from '@corentinth/chisels';
import { createError } from '../../shared/errors/errors';
import { FS_STORAGE_DRIVER_NAME, fsStorageDriverFactory } from './drivers/fs/fs.storage-driver';

const storageDriverFactories = {
  [FS_STORAGE_DRIVER_NAME]: fsStorageDriverFactory,
};

export type DocumentStorageService = Awaited<ReturnType<typeof createDocumentStorageService>>;

export async function createDocumentStorageService({ config }: { config: Config }) {
  const storageDriverName = config.documentsStorage.driver;

  const storageDriverFactory = storageDriverFactories[storageDriverName];

  if (!storageDriverFactory) {
    throw createError({
      message: `Unknown storage driver: ${storageDriverName}`,
      code: 'storage_driver.unknown_driver',
      isInternal: true,
      statusCode: 500,
    });
  }

  const storageDriver = await storageDriverFactory({ config });

  return injectArguments({
    saveFile,
  }, {
    storageDriver,
  });
}

async function saveFile({ storageDriver, fileStream, fileName }: { storageDriver: StorageDriver; fileStream: ReadableStream; fileName: string }) {
  return storageDriver.saveFile({ fileStream, fileName });
}
