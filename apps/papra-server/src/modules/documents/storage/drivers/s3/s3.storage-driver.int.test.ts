import { CreateBucketCommand } from '@aws-sdk/client-s3';
import { LocalstackContainer } from '@testcontainers/localstack';
import { describe } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../../test/containers/images';
import { overrideConfig } from '../../../../config/config.test-utils';
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

        const config = overrideConfig({
          documentsStorage: {
            drivers: {
              s3: {
                accessKeyId: 'test',
                secretAccessKey: 'test',
                bucketName,
                region: 'us-east-1',
                endpoint: localstackContainer.getConnectionUri(),
                forcePathStyle: true,
              },
            },
          },
        });

        const driver = s3StorageDriverFactory({ config });

        const s3Client = driver.getClient();

        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));

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
