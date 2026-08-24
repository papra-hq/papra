import { inMemoryStorageDriverFactory } from './drivers/memory/memory.storage-driver';
import { createStorageServiceFromDriver } from './storage.services';

export function createInMemoryStorageService() {
  const driver = inMemoryStorageDriverFactory();

  const service = createStorageServiceFromDriver({
    storageDriver: driver,
    encryptionOptions: {
      isEncryptionEnabled: false,
      keyEncryptionKeys: [],
    },
  });

  return {
    ...service,
    _getStorage: driver._getStorage,
  };
}
