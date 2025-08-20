import type { Readable } from 'node:stream';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Upload } from '@aws-sdk/lib-storage';
import { safely } from '@corentinth/chisels';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const S3_STORAGE_DRIVER_NAME = 's3' as const;

function isS3NotFoundError(error: Error) {
  const codes = ['NoSuchKey', 'NotFound'];

  return codes.includes(error.name)
    || ('Code' in error && typeof error.Code === 'string' && codes.includes(error.Code));
}

export const s3StorageDriverFactory = defineStorageDriver(({ config }) => {
  const { accessKeyId, secretAccessKey, bucketName, region, endpoint, forcePathStyle } = config.documentsStorage.drivers.s3;

  const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle,
  });

  return {
    name: S3_STORAGE_DRIVER_NAME,
    getClient: () => s3Client,
    saveFile: async ({ fileStream, storageKey }) => {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucketName,
          Key: storageKey,
          Body: fileStream,
        },
      });

      await upload.done();

      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      const [result, error] = await safely(s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      })));

      if (error && isS3NotFoundError(error)) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }

      const { Body } = result;

      if (!Body) {
        throw createFileNotFoundError();
      }

      return { fileStream: Body as Readable };
    },
    deleteFile: async ({ storageKey }) => {
      // First check if the file exists
      const [, error] = await safely(s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      })));

      if (error && isS3NotFoundError(error)) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }

      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }));
    },
  };
});
