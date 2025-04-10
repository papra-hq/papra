import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { FS_STORAGE_DRIVER_NAME } from './drivers/fs/fs.storage-driver';
import { IN_MEMORY_STORAGE_DRIVER_NAME } from './drivers/memory/memory.storage-driver';
import { S3_STORAGE_DRIVER_NAME } from './drivers/s3/s3.storage-driver';

export const documentStorageConfig = {
  maxUploadSize: {
    doc: 'The maximum size in bytes for an uploaded file. Set to 0 to disable the limit and allow uploading documents of any size.',
    schema: z.coerce.number().int().nonnegative(),
    default: 10 * 1024 * 1024, // 10MB
    env: 'DOCUMENT_STORAGE_MAX_UPLOAD_SIZE',
  },
  driver: {
    doc: `The driver to use for document storage, values can be one of: ${[FS_STORAGE_DRIVER_NAME, S3_STORAGE_DRIVER_NAME, IN_MEMORY_STORAGE_DRIVER_NAME].map(x => `\`${x}\``).join(', ')}`,
    schema: z.enum([FS_STORAGE_DRIVER_NAME, S3_STORAGE_DRIVER_NAME, IN_MEMORY_STORAGE_DRIVER_NAME]),
    default: FS_STORAGE_DRIVER_NAME,
    env: 'DOCUMENT_STORAGE_DRIVER',
  },
  drivers: {
    filesystem: {
      root: {
        doc: 'The root directory to store documents in (default as "./app-data/documents" when using docker)',
        schema: z.string(),
        default: './local-documents',
        env: 'DOCUMENT_STORAGE_FILESYSTEM_ROOT',
      },
    },
    s3: {
      accessKeyId: {
        doc: 'The AWS access key ID for S3',
        schema: z.string(),
        default: '',
        env: 'DOCUMENT_STORAGE_S3_ACCESS_KEY_ID',
      },
      secretAccessKey: {
        doc: 'The AWS secret access key for S3',
        schema: z.string(),
        default: '',
        env: 'DOCUMENT_STORAGE_S3_SECRET_ACCESS_KEY',
      },
      bucketName: {
        doc: 'The S3 bucket name',
        schema: z.string(),
        default: '',
        env: 'DOCUMENT_STORAGE_S3_BUCKET_NAME',
      },
      region: {
        doc: 'The AWS region for S3',
        schema: z.string(),
        default: 'auto',
        env: 'DOCUMENT_STORAGE_S3_REGION',
      },
      endpoint: {
        doc: 'The S3 endpoint',
        schema: z.string().optional(),
        default: undefined,
        env: 'DOCUMENT_STORAGE_S3_ENDPOINT',
      },
    },
  },
} as const satisfies ConfigDefinition;
