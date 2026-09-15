import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { LocalstackContainer } from '@testcontainers/localstack';
import { S3mini } from 's3mini';
import { request } from 'undici';
import { describe, expect, test } from 'vitest';
import { TEST_CONTAINER_IMAGES } from '../../../../../test/containers/images';
import { IN_BYTES } from '../../../shared/units';
import { runDriverTestSuites } from '../drivers.test-suite';
import {
  buildS3StorageDriver,
  MULTIPART_MIN_PART_SIZE_IN_BYTES,
  s3StorageDriverFactory,
} from './s3.storage-driver';

async function createDriver() {
  const localstackContainer = await new LocalstackContainer(
    TEST_CONTAINER_IMAGES.LOCALSTACK,
  ).start();

  try {
    const driver = s3StorageDriverFactory({
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucketName: 'test-bucket',
      region: 'eu-central-1',
      endpoint: localstackContainer.getConnectionUri(),
      forcePathStyle: true,
    });
    await driver.getClient().createBucket();

    return {
      driver,
      [Symbol.asyncDispose]: async () => {
        await localstackContainer.stop();
      },
    };
  } catch (error) {
    await localstackContainer.stop();
    throw error;
  }
}

describe('s3 storage-driver', () => {
  describe('s3StorageDriver', () => {
    runDriverTestSuites({
      // In the ci it take more than 30 seconds to pull images
      timeout: 40_000,
      retry: 3,
      createDriver,
    });

    test('copies content headers and user metadata', { timeout: 40_000 }, async () => {
      await using resource = await createDriver();
      const { driver } = resource;
      const client = driver.getClient();
      const metadata = {
        'x-amz-meta-original-name': 'original.txt',
        'cache-control': 'private, max-age=3600',
        'content-disposition': 'attachment; filename="original.txt"',
        'content-language': 'fr',
      };
      await client.putObject('source.txt', 'original content', 'text/plain', undefined, metadata);

      await driver.copyFile({ sourceStorageKey: 'source.txt', destinationStorageKey: 'copy.txt' });

      const response = await client.getObjectResponse('copy.txt');
      expect.assert(response);
      expect(await response.text()).toEqual('original content');
      expect(Object.fromEntries(response.headers)).toMatchObject({
        ...metadata,
        'content-type': 'text/plain',
      });
    });

    test(
      'copies objects above the single-copy limit through a raw multipart stream with metadata',
      { timeout: 40_000 },
      async () => {
        await using resource = await createDriver();
        const client = resource.driver.getClient();
        const sourceStorageKey = 'dossier été/文档 + #%.bin';
        const destinationStorageKey = 'copie été/資料 + #%.bin';
        const content = gzipSync(randomBytes(9 * IN_BYTES.MEGABYTE));
        const metadata = {
          'x-amz-meta-original-name': 'original.bin',
          'cache-control': 'private, max-age=3600',
          'content-disposition': 'attachment; filename="original.bin"',
          'content-encoding': 'gzip',
          'content-language': 'fr',
        };
        await client.putObject(
          sourceStorageKey,
          content,
          'application/octet-stream',
          undefined,
          metadata,
        );

        const copier = buildS3StorageDriver({
          client: new S3mini({
            accessKeyId: 'test',
            secretAccessKey: 'test',
            region: client.region,
            endpoint: client.endpoint.toString(),
            minPartSize: MULTIPART_MIN_PART_SIZE_IN_BYTES,
            fetch: async (input, init) => {
              if (init?.method === 'PUT' && new Headers(init.headers).has('x-amz-copy-source')) {
                throw new Error('CopyObject cannot copy objects above 5 GiB');
              }

              const response = await fetch(input, init);

              if (init?.method === 'HEAD' && response.ok) {
                // Advertise a >5 GiB source without allocating or transferring that much data.
                const headers = new Headers(response.headers);
                headers.set('content-length', String(5 * IN_BYTES.GIGABYTE + 1));
                return new Response(null, { status: response.status, headers });
              }

              return response;
            },
          }),
        });

        await copier.copyFile({ sourceStorageKey, destinationStorageKey });
        await resource.driver.deleteFile({ storageKey: sourceStorageKey });

        const response = await request(await client.getPresignedUrl('GET', destinationStorageKey));
        expect(Buffer.from(await response.body.arrayBuffer()).equals(content)).toEqual(true);
        expect(response.statusCode).toEqual(200);
        expect(response.headers).toMatchObject({
          ...metadata,
          'content-type': 'application/octet-stream',
        });
      },
    );
  });
});
