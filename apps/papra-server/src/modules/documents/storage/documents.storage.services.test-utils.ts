import { createDocumentStorageServiceFromDriver } from './documents.storage.services';
import { inMemoryStorageDriverFactory } from './drivers/memory/memory.storage-driver';

export function createInMemoryDocumentStorageServices() {
  const driver = inMemoryStorageDriverFactory();

  const service = createDocumentStorageServiceFromDriver({
    storageDriver: driver,
    encryptionConfig: {
      isEncryptionEnabled: false,
      documentKeyEncryptionKeys: [],
    },
  });

  return {
    ...service,
    _getStorage: driver._getStorage,
  };
}
