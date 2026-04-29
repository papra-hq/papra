import type { DocumentStorageConfig } from '../../documents.storage.types';
import type { S3mini } from 's3mini';
import { LocalstackContainer } from '@testcontainers/localstack';
import { describe } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../../test/containers/images';
import { runDriverTestSuites } from '../drivers.test-suite';
import { s3StorageDriverFactory } from './s3.storage-driver';

describe('s3 storage-driver', () => {
  describe('s3StorageDriver', () => {
    runDriverTestSuites({
      // In the ci it take more than 30 seconds to pull images
      timeout: 40_000,
      retry: 3,
      createDriver: async () => {
        const localstackContainer = await new LocalstackContainer(TEST_CONTAINER_IMAGES.LOCALSTACK).start();
        const bucketName = 'test-bucket';
        const endpoint = localstackContainer.getConnectionUri();

        const driver = s3StorageDriverFactory({
          documentStorageConfig: {
            drivers: {
              s3: {
                accessKeyId: 'test',
                secretAccessKey: 'test',
                bucketName,
                region: 'us-east-1',
                endpoint,
                forcePathStyle: true,
              },
            },
          } as DocumentStorageConfig,
        });

        const client = driver.getClient() as S3mini;
        await client.createBucket();

        return {
          driver,
          [Symbol.asyncDispose]: async () => {
            await localstackContainer.stop();
          },
        };
      },
    });
  });
});
