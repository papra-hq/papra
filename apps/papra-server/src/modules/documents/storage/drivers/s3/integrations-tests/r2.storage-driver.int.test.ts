import type { DocumentStorageConfig } from '../../../documents.storage.types';
import { describe } from 'vitest';
import { runDriverTestSuites } from '../../drivers.test-suite';
import { s3StorageDriverFactory } from '../s3.storage-driver';

const endpoint = process.env.TEST_R2_ENDPOINT;
const bucketName = process.env.TEST_R2_BUCKET_NAME;
const accessKeyId = process.env.TEST_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.TEST_R2_SECRET_ACCESS_KEY;

describe('s3 storage-driver', () => {
  describe.skipIf(!endpoint)('r2 bucket', () => {
    runDriverTestSuites({
      createDriver: async () => {
        const driver = s3StorageDriverFactory({
          documentStorageConfig: {
            drivers: {
              s3: {
                accessKeyId,
                secretAccessKey,
                bucketName,
                region: 'auto',
                endpoint,
                forcePathStyle: true,
              },
            },
          } as DocumentStorageConfig,
        });

        return {
          driver,
          [Symbol.asyncDispose]: async () => {},
        };
      },
    });
  });
});
