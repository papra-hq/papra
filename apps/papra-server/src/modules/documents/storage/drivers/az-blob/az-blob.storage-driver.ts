import type { Readable } from 'node:stream';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

import { safely } from '@corentinth/chisels';
import { createFileAlreadyExistsInStorageError, createFileNotFoundError } from '../../document-storage.errors';
import { defineStorageDriver } from '../drivers.models';
import { isAzureBlobAlreadyExistsError, isAzureBlobNotFoundError } from './az-blob.models';

export const AZ_BLOB_STORAGE_DRIVER_NAME = 'azure-blob' as const;

export const azBlobStorageDriverFactory = defineStorageDriver(({ documentStorageConfig }) => {
  const { accountName, accountKey, containerName, connectionString } = documentStorageConfig.drivers.azureBlob;

  const blobServiceClient = connectionString !== undefined
    ? BlobServiceClient.fromConnectionString(connectionString)
    : new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new StorageSharedKeyCredential(accountName, accountKey));

  const getBlockBlobClient = ({ storageKey }: { storageKey: string }) => blobServiceClient.getContainerClient(containerName).getBlockBlobClient(storageKey);

  return {
    name: AZ_BLOB_STORAGE_DRIVER_NAME,
    getClient: () => blobServiceClient,
    saveFile: async ({ fileStream, storageKey }) => {
      const [, error] = await safely(getBlockBlobClient({ storageKey }).uploadStream(fileStream, undefined, undefined, { conditions: { ifNoneMatch: '*' } })); // Love those undefined :chef_kiss:

      if (error) {
        throw isAzureBlobAlreadyExistsError({ error })
          ? createFileAlreadyExistsInStorageError()
          : error;
      }
    },
    getFileStream: async ({ storageKey }) => {
      const [response, error] = await safely(getBlockBlobClient({ storageKey }).download());

      if (error && isAzureBlobNotFoundError({ error })) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }

      const { readableStreamBody } = response;

      return { fileStream: readableStreamBody as Readable };
    },
    deleteFile: async ({ storageKey }) => {
      const [, error] = await safely(getBlockBlobClient({ storageKey }).delete());

      if (error && isAzureBlobNotFoundError({ error })) {
        throw createFileNotFoundError();
      }

      if (error) {
        throw error;
      }
    },
    fileExists: async ({ storageKey }) => {
      const [, error] = await safely(getBlockBlobClient({ storageKey }).getProperties());

      if (error && isAzureBlobNotFoundError({ error })) {
        return false;
      }

      if (error) {
        throw error;
      }

      return true;
    },
  };
});
