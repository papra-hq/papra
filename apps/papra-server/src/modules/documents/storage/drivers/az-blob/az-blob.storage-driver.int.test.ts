import { AzuriteContainer } from '@testcontainers/azurite';
import { describe } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../../test/containers/images';
import { overrideConfig } from '../../../../config/config.test-utils';
import { runDriverTestSuites } from '../drivers.test-suite';
import { azBlobStorageDriverFactory } from './az-blob.storage-driver';

describe('az-blob storage-driver', () => {
  describe('azBlobStorageDriver', () => {
    runDriverTestSuites({
      timeout: 30_000,
      createDriver: async () => {
        const azuriteContainer = await new AzuriteContainer(TEST_CONTAINER_IMAGES.AZURITE).withInMemoryPersistence().start();
        const connectionString = azuriteContainer.getConnectionString();

        const config = overrideConfig({
          documentsStorage: { drivers: { azureBlob: { connectionString, containerName: 'test-container' } } },
        });

        const driver = azBlobStorageDriverFactory({ config });
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
