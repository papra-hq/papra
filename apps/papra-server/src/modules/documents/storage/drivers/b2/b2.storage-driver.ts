import { Buffer } from 'node:buffer';
import B2 from 'backblaze-b2';

import { isNil } from '../../../../shared/utils';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const B2_STORAGE_DRIVER_NAME = 'b2' as const;

export const b2StorageDriverFactory = defineStorageDriver(async ({ config }) => {
  const { applicationKeyId, applicationKey, bucketId, bucketName } = config.documentsStorage.drivers.b2;

  const b2Client = new B2({
    applicationKey,
    applicationKeyId,
  });

  return {
    name: B2_STORAGE_DRIVER_NAME,
    saveFile: async ({ file, storageKey }) => {
      await b2Client.authorize();
      const getUploadUrl = await b2Client.getUploadUrl({
        bucketId,
      });
      const upload = await b2Client.uploadFile({
        // eslint-disable-next-line ts/no-unsafe-member-access
        uploadUrl: getUploadUrl.data?.uploadUrl as string,
        // eslint-disable-next-line ts/no-unsafe-member-access
        uploadAuthToken: getUploadUrl.data?.authorizationToken as string,
        fileName: storageKey,
        data: Buffer.from(await file.arrayBuffer()),
      });
      if (upload.status !== 200) {
        throw createFileNotFoundError();
      }
      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      await b2Client.authorize();

      const response = await b2Client.downloadFileByName({
        bucketName,
        fileName: storageKey,
        responseType: 'stream',
      });

      if (isNil(response.data)) {
        throw createFileNotFoundError();
      }

      return { fileStream: response.data as ReadableStream };
    },
    deleteFile: async ({ storageKey }) => {
      await b2Client.hideFile({
        bucketId,
        fileName: storageKey,
      });
    },
  };
});
