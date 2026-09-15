import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema } from '../config/config.schemas';
import { storageDriverNames } from './drivers/storage-drivers.registry';
import { FS_STORAGE_DRIVER_NAME } from './drivers/fs/fs.storage-driver';

export function createStorageConfig({
  envPrefix,
  defaultFilesystemRoot,
}: {
  envPrefix: string;
  defaultFilesystemRoot: string;
}) {
  return {
    driver: {
      doc: `The driver to use for storage, values can be one of: ${storageDriverNames.map((name) => `\`${name}\``).join(', ')}`,
      schema: v.picklist(storageDriverNames),
      default: FS_STORAGE_DRIVER_NAME,
      env: `${envPrefix}_DRIVER`,
    },
    drivers: {
      filesystem: {
        root: {
          doc: 'The root directory in which files are stored',
          schema: v.string(),
          default: defaultFilesystemRoot,
          env: `${envPrefix}_FILESYSTEM_ROOT`,
        },
      },
      s3: {
        accessKeyId: {
          doc: 'The AWS access key ID for S3',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_S3_ACCESS_KEY_ID`,
        },
        secretAccessKey: {
          doc: 'The AWS secret access key for S3',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_S3_SECRET_ACCESS_KEY`,
        },
        bucketName: {
          doc: 'The S3 bucket name',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_S3_BUCKET_NAME`,
        },
        region: {
          doc: 'The AWS region for S3',
          schema: v.string(),
          default: 'auto',
          env: `${envPrefix}_S3_REGION`,
        },
        endpoint: {
          doc: 'The S3 endpoint',
          schema: v.optional(v.string()),
          default: undefined,
          env: `${envPrefix}_S3_ENDPOINT`,
        },
        forcePathStyle: {
          doc: 'Whether to force path style URLs for S3',
          schema: booleanishSchema,
          default: false,
          env: `${envPrefix}_S3_FORCE_PATH_STYLE`,
        },
      },
      azureBlob: {
        connectionString: {
          doc: 'The Azure Blob Storage connection string; when set, account credentials are ignored',
          schema: v.optional(v.string()),
          default: undefined,
          env: `${envPrefix}_AZURE_BLOB_CONNECTION_STRING`,
        },
        accountName: {
          doc: 'The Azure Blob Storage account name',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_AZURE_BLOB_ACCOUNT_NAME`,
        },
        accountKey: {
          doc: 'The Azure Blob Storage account key',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_AZURE_BLOB_ACCOUNT_KEY`,
        },
        containerName: {
          doc: 'The Azure Blob Storage container name',
          schema: v.string(),
          default: '',
          env: `${envPrefix}_AZURE_BLOB_CONTAINER_NAME`,
        },
      },
    },
  } as const satisfies ConfigDefinition;
}
