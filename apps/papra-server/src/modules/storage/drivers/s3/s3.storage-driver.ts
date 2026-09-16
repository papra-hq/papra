import type { S3StorageDriverOptions } from '../../storage.types';
import type { StorageDriver } from '../drivers.models';
import { Readable } from 'node:stream';
import { S3mini } from 's3mini';
import { request } from 'undici';
import {
  createFileAlreadyExistsInStorageError,
  createFileNotFoundError,
} from '../../storage.errors';
import { bufferStreamUpToThreshold, buildEndpointUrl } from './s3.storage-driver.models';
import { IN_BYTES } from '../../../shared/units';

export const S3_STORAGE_DRIVER_NAME = 's3' as const;

export const MULTIPART_MIN_PART_SIZE_IN_BYTES = 8 * IN_BYTES.MEGABYTE;
const MAX_SINGLE_COPY_SIZE_IN_BYTES = 5 * IN_BYTES.GIGABYTE;

const COPY_METADATA_HEADERS = new Set([
  'content-type',
  'cache-control',
  'content-disposition',
  'content-encoding',
  'content-language',
  'expires',
  'x-amz-website-redirect-location',
  'x-amz-storage-class',
]);

export const s3StorageDriverFactory = ({
  accessKeyId,
  secretAccessKey,
  bucketName,
  region,
  endpoint,
  forcePathStyle,
}: S3StorageDriverOptions) => {
  const client = new S3mini({
    accessKeyId,
    secretAccessKey,
    region,
    endpoint: buildEndpointUrl({ endpoint, region, bucketName, forcePathStyle }),
    minPartSize: MULTIPART_MIN_PART_SIZE_IN_BYTES,
  });

  return buildS3StorageDriver({ client });
};

export function buildS3StorageDriver({ client }: { client: S3mini }) {
  const fileExists = async ({ storageKey }: { storageKey: string }) => {
    return (await client.objectExists(storageKey)) === true;
  };

  return {
    name: S3_STORAGE_DRIVER_NAME,
    getClient: () => client,
    saveFile: async ({ fileStream, storageKey, mimeType }) => {
      if (await fileExists({ storageKey })) {
        // Not atomic, TOCTOU issue here, but conditional create headers (If-None-Match)
        // aren't supported reliably across S3-compatible providers.
        throw createFileAlreadyExistsInStorageError();
      }

      const buffered = await bufferStreamUpToThreshold({
        stream: fileStream,
        thresholdInBytes: MULTIPART_MIN_PART_SIZE_IN_BYTES,
      });

      if (buffered.isFullyBuffered) {
        // Known size: a single PUT, avoiding the multipart round-trips.
        await client.putObject(storageKey, buffered.buffer, mimeType);
      } else {
        await client.putAnyObject(storageKey, Readable.toWeb(buffered.stream), mimeType);
      }
    },
    copyFile: async ({ sourceStorageKey, destinationStorageKey }) => {
      if (!(await fileExists({ storageKey: sourceStorageKey }))) {
        throw createFileNotFoundError();
      }

      // Like saveFile, this collision check is not atomic across S3-compatible providers.
      if (await fileExists({ storageKey: destinationStorageKey })) {
        throw createFileAlreadyExistsInStorageError();
      }

      const size = await client.getContentLength(sourceStorageKey);

      if (size <= MAX_SINGLE_COPY_SIZE_IN_BYTES) {
        await client.copyObject(sourceStorageKey, destinationStorageKey, {
          metadataDirective: 'COPY',
        });
        return;
      }

      // CopyObject is limited to 5 GiB. Stream the stored bytes through a multipart upload.
      // undici.request does not transparently decompress Content-Encoding, unlike fetch.
      const url = await client.getPresignedUrl('GET', sourceStorageKey);
      const { body, headers, statusCode } = await request(url);

      try {
        if (statusCode === 404) {
          throw createFileNotFoundError();
        }

        if (statusCode !== 200) {
          throw new Error(`Unable to read S3 copy source: HTTP ${statusCode}`);
        }

        const metadataHeaders = Object.fromEntries(
          Object.entries(headers).filter(
            (entry): entry is [string, string] =>
              typeof entry[1] === 'string' &&
              (entry[0].startsWith('x-amz-meta-') || COPY_METADATA_HEADERS.has(entry[0])),
          ),
        );

        await client.putAnyObject(
          destinationStorageKey,
          Readable.toWeb(body),
          metadataHeaders['content-type'],
          undefined,
          metadataHeaders,
        );
      } finally {
        body.destroy();
      }
    },
    getFileStream: async ({ storageKey }) => {
      const response = await client.getObjectResponse(storageKey);

      if (!response?.body) {
        throw createFileNotFoundError();
      }

      return { fileStream: Readable.fromWeb(response.body) };
    },
    deleteFile: async ({ storageKey }) => {
      if (!(await fileExists({ storageKey }))) {
        throw createFileNotFoundError();
      }

      await client.deleteObject(storageKey);
    },
    fileExists,
  } satisfies StorageDriver & { getClient: () => S3mini };
}
