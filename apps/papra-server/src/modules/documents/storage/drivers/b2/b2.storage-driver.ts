import { Buffer } from 'node:buffer';
import B2 from 'backblaze-b2';

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
      try {
        await b2Client.authorize();
        const getUploadUrl = await b2Client.getUploadUrl({
          bucketId,
        });
        const upload = await b2Client.uploadFile({
          uploadUrl: getUploadUrl.data.uploadUrl,
          uploadAuthToken: getUploadUrl.data.authorizationToken,
          fileName: storageKey,
          data: Buffer.from(await file.arrayBuffer()),
        });
        if (upload.status !== 200) {
          throw new Error('Error uploading file');
        }
        return { storageKey };
      } catch (_) {
        throw new Error('Error uploading file');
      }
      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      try {
        await b2Client.authorize();
        const response = await b2Client.downloadFileByName({
          bucketName,
          fileName: storageKey,
          responseType: 'blob',
        });
        if (!response.data) {
          throw new Error('File not found or has no content');
        }
        return { fileStream: response.data };
      } catch (_) {
        throw new Error('Error getting file');
      }
    },
    deleteFile: async ({ storageKey }) => {
      await b2Client.hideFile({
        bucketId,
        fileName: storageKey,
      });
    },
  };
});
