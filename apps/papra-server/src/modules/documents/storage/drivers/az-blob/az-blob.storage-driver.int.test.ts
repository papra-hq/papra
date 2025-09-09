import type { DocumentStorageConfig } from '../../documents.storage.types';
import { AzuriteContainer } from '@testcontainers/azurite';
import { describe } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../../test/containers/images';
import { runDriverTestSuites } from '../drivers.test-suite';
import { azBlobStorageDriverFactory } from './az-blob.storage-driver';

describe('az-blob storage-driver', () => {
  describe('azBlobStorageDriver', () => {
    runDriverTestSuites({
      timeout: 30_000,
      createDriver: async () => {
        const azuriteContainer = await new AzuriteContainer(TEST_CONTAINER_IMAGES.AZURITE).withInMemoryPersistence().start();
        const connectionString = azuriteContainer.getConnectionString();

        const driver = azBlobStorageDriverFactory({ documentStorageConfig: { drivers: { azureBlob: { connectionString, containerName: 'test-container' } } } as DocumentStorageConfig });
        const client = driver.getClient();
        await client.createContainer('test-container');

        return {
          driver,
          [Symbol.asyncDispose]: async () => {
            await azuriteContainer.stop();
          },
        };
      },
    });
  });
});
