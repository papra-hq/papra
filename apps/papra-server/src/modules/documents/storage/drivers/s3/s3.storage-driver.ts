import { Buffer } from 'node:buffer';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Upload } from '@aws-sdk/lib-storage';
import { deriveKeyWithHkdf } from '../../../../shared/crypto/key-derivation';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';
import { createSseConfig } from './s3.models';

export const S3_STORAGE_DRIVER_NAME = 's3' as const;

export const s3StorageDriverFactory = defineStorageDriver(async ({ config }) => {
  const { accessKeyId, secretAccessKey, bucketName, region, endpoint, ssec } = config.documentsStorage.drivers.s3;

  const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    name: S3_STORAGE_DRIVER_NAME,
    saveFile: async ({ file, storageKey, fileEncryptionKey }) => {
      const sseConfig = ssec.isEnabled
        ? createSseConfig({
            encryptionKey: await deriveKeyWithHkdf({ key: ssec.encryptionKey, salt: ssec.encryptionKeySalt, info: fileEncryptionKey }).then(key => Buffer.from(key).toString('base64')),
            algorithm: ssec.algorithm,
          })
        : {};

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucketName,
          Key: storageKey,
          Body: file.stream(),
          ContentLength: file.size,
          ...sseConfig,
        },
      });

      await upload.done();

      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      const { Body } = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }));

      if (!Body) {
        throw createFileNotFoundError();
      }

      return { fileStream: Body.transformToWebStream() };
    },
    deleteFile: async ({ storageKey }) => {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }));
    },
  };
});
