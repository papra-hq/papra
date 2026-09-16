import { AzuriteContainer } from '@testcontainers/azurite';
import { describe, expect, test } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../test/containers/images';
import { runDriverTestSuites } from '../drivers.test-suite';
import { azBlobStorageDriverFactory } from './az-blob.storage-driver';

describe('az-blob storage-driver', () => {
  describe('azBlobStorageDriver', () => {
    runDriverTestSuites({
      timeout: 30_000,
      createDriver: async () => {
        const azuriteContainer = await new AzuriteContainer(TEST_CONTAINER_IMAGES.AZURITE)
          .withInMemoryPersistence()
          .start();
        const connectionString = azuriteContainer.getConnectionString();

        const driver = azBlobStorageDriverFactory({
          connectionString,
          containerName: 'test-container',
          accountName: '',
          accountKey: '',
        });
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

    test('copies blob metadata and content headers', { timeout: 30_000 }, async () => {
      const container = await new AzuriteContainer(TEST_CONTAINER_IMAGES.AZURITE)
        .withInMemoryPersistence()
        .start();

      try {
        const driver = azBlobStorageDriverFactory({
          connectionString: container.getConnectionString(),
          containerName: 'test-container',
          accountName: '',
          accountKey: '',
        });
        const client = driver.getClient();
        await client.createContainer('test-container');
        const containerClient = client.getContainerClient('test-container');
        const source = containerClient.getBlockBlobClient('source.txt');
        const destination = containerClient.getBlockBlobClient('copy.txt');
        const metadata = { originalname: 'original.txt' };
        await source.upload('original content', 16, {
          metadata,
          blobHTTPHeaders: {
            blobContentType: 'text/plain',
            blobContentDisposition: 'attachment; filename="original.txt"',
            blobCacheControl: 'private, max-age=3600',
          },
        });

        await driver.copyFile({
          sourceStorageKey: 'source.txt',
          destinationStorageKey: 'copy.txt',
        });

        expect(await destination.getProperties()).toMatchObject({
          metadata,
          contentType: 'text/plain',
          contentDisposition: 'attachment; filename="original.txt"',
          cacheControl: 'private, max-age=3600',
          copyStatus: 'success',
        });
        expect((await destination.downloadToBuffer()).toString()).toEqual('original content');
      } finally {
        await container.stop();
      }
    });
  });
});
