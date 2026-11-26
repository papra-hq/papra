import type { StartedAzuriteContainer } from '@testcontainers/azurite';
import { randomUUID } from 'node:crypto';
import { AzuriteContainer } from '@testcontainers/azurite';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../test/containers/images';
import { runDriverTestSuites } from '../drivers.test-suite';
import { azBlobStorageDriverFactory } from './az-blob.storage-driver';

describe('az-blob storage-driver', () => {
  let azuriteContainer: StartedAzuriteContainer | undefined;

  beforeAll(async () => {
    azuriteContainer = await new AzuriteContainer(TEST_CONTAINER_IMAGES.AZURITE)
      .withInMemoryPersistence()
      .start();
  }, 120_000);

  afterAll(async () => {
    await azuriteContainer?.stop();
  }, 30_000);

  async function createDriver() {
    expect.assert(azuriteContainer);
    const containerName = `test-${randomUUID()}`;
    const driver = azBlobStorageDriverFactory({
      connectionString: azuriteContainer.getConnectionString(),
      containerName,
      accountName: '',
      accountKey: '',
    });
    const containerClient = driver.getClient().getContainerClient(containerName);
    await containerClient.create();

    return {
      driver,
      containerClient,
      [Symbol.asyncDispose]: async () => {
        await containerClient.delete();
      },
    };
  }

  describe('azBlobStorageDriver', () => {
    runDriverTestSuites({
      timeout: 30_000,
      createDriver,
    });

    test('copies blob metadata and content headers', { timeout: 30_000 }, async () => {
      await using resource = await createDriver();
      const { driver, containerClient } = resource;
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
    });
  });
});
