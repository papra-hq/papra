import { Readable } from 'node:stream';
import { S3mini } from 's3mini';
import { safely } from '@corentinth/chisels';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const S3_STORAGE_DRIVER_NAME = 's3' as const;

function buildS3Endpoint({ endpoint, region, bucketName, forcePathStyle }: {
  endpoint?: string;
  region: string;
  bucketName: string;
  forcePathStyle?: boolean;
}): string {
  if (endpoint) {
    const base = endpoint.replace(/\/$/, '');
    return forcePathStyle
      ? `${base}/${bucketName}`
      : base.replace('://', `://${bucketName}.`);
  }

  return forcePathStyle
    ? `https://s3.${region}.amazonaws.com/${bucketName}`
    : `https://${bucketName}.s3.${region}.amazonaws.com`;
}

export const s3StorageDriverFactory = defineStorageDriver(({ documentStorageConfig }) => {
  const { accessKeyId, secretAccessKey, bucketName, region, endpoint, forcePathStyle } = documentStorageConfig.drivers.s3;

  const s3Endpoint = buildS3Endpoint({ endpoint, region, bucketName, forcePathStyle });

  const s3Client = new S3mini({
    accessKeyId,
    secretAccessKey,
    endpoint: s3Endpoint,
    region,
  });

  const fileExists = async ({ storageKey }: { storageKey: string }) => {
    const exists = await s3Client.objectExists(storageKey);
    return exists === true;
  };

  return {
    name: S3_STORAGE_DRIVER_NAME,
    getClient: () => s3Client,
    saveFile: async ({ fileStream, storageKey }) => {
      if (await fileExists({ storageKey })) {
        throw createFileAlreadyExistsInStorageError();
      }

      // Convert Node.js Readable to web ReadableStream for s3mini compatibility.
      // putAnyObject automatically selects single PUT or multipart upload based on size.
      const webStream = Readable.toWeb(fileStream) as ReadableStream;
      await s3Client.putAnyObject(storageKey, webStream);
    },
    getFileStream: async ({ storageKey }) => {
      const [rawResponse, error] = await safely(s3Client.getObjectResponse(storageKey));

      if (error) {
        throw error;
      }

      const response = rawResponse as Response;

      if (!response || !response.ok) {
        throw createFileNotFoundError();
      }

      if (!response.body) {
        throw createFileNotFoundError();
      }

      return { fileStream: Readable.fromWeb(response.body as any) };
    },
    deleteFile: async ({ storageKey }) => {
      const exists = await fileExists({ storageKey });

      if (!exists) {
        throw createFileNotFoundError();
      }

      await s3Client.deleteObject(storageKey);
    },
    fileExists,
  };
});
