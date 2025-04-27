import { Readable } from 'node:stream';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const AZ_BLOB_STORAGE_DRIVER_NAME = 'azure-blob' as const;

export const azBlobStorageDriverFactory = defineStorageDriver(async ({ config }) => {
  const { accountName, accountKey, containerName } = config.documentsStorage.drivers.azureBlob;

  const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new StorageSharedKeyCredential(accountName, accountKey));

  return {
    name: AZ_BLOB_STORAGE_DRIVER_NAME,
    saveFile: async ({ file, storageKey }) => {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.uploadBlockBlob(storageKey, Readable.fromWeb(file.stream()), file.size);
      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(storageKey);
      const { readableStreamBody } = await blockBlobClient.download();

      if (!readableStreamBody) {
        throw createFileNotFoundError();
      }

      return { fileStream: Readable.toWeb(readableStreamBody as Readable) };
    },
    deleteFile: async ({ storageKey }) => {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(storageKey);
      await blockBlobClient.delete();
    },
  };
});
