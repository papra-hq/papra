import type { Readable } from 'node:stream';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

import { safely } from '@corentinth/chisels';
import { createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';

export const AZ_BLOB_STORAGE_DRIVER_NAME = 'azure-blob' as const;

function isAzureBlobNotFoundError(error: Error): boolean {
  return ('statusCode' in error && error.statusCode === 404) || ('code' in error && error.code === 'BlobNotFound');
}

export const azBlobStorageDriverFactory = defineStorageDriver(({ config }) => {
  const { accountName, accountKey, containerName, connectionString } = config.documentsStorage.drivers.azureBlob;

  const blobServiceClient = connectionString !== undefined
    ? BlobServiceClient.fromConnectionString(connectionString)
    : new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new StorageSharedKeyCredential(accountName, accountKey));

  return {
    name: AZ_BLOB_STORAGE_DRIVER_NAME,
    getClient: () => blobServiceClient,
    saveFile: async ({ fileStream, storageKey }) => {
      await blobServiceClient
        .getContainerClient(containerName)
        .getBlockBlobClient(storageKey)
        .uploadStream(fileStream);

      return { storageKey };
    },
    getFileStream: async ({ storageKey }) => {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(storageKey);
      const [response, error] = await safely(blockBlobClient.download());

      if (error && isAzureBlobNotFoundError(error)) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }

      const { readableStreamBody } = response;

      return { fileStream: readableStreamBody as Readable };
    },
    deleteFile: async ({ storageKey }) => {
      const [, error] = await safely(blobServiceClient.getContainerClient(containerName).getBlockBlobClient(storageKey).delete());

      if (error && isAzureBlobNotFoundError(error)) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }
    },
  };
});
