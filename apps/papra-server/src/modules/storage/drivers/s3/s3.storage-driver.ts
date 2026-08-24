import type { S3StorageDriverOptions } from '../../storage.types';
import type { StorageDriver } from '../drivers.models';
import { Readable } from 'node:stream';
import { S3mini } from 's3mini';
import {
  createFileAlreadyExistsInStorageError,
  createFileNotFoundError,
} from '../../storage.errors';
import { bufferStreamUpToThreshold, buildEndpointUrl } from './s3.storage-driver.models';
import { IN_BYTES } from '../../../shared/units';

export const S3_STORAGE_DRIVER_NAME = 's3' as const;

export const MULTIPART_MIN_PART_SIZE_IN_BYTES = 8 * IN_BYTES.MEGABYTE;

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
};
