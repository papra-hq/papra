import { describe, expect, test } from 'vitest';
import { createStorageConfig } from './storage.config';

describe('createStorageConfig', () => {
  test('creates independent definitions for different prefixes and filesystem defaults', () => {
    const documents = createStorageConfig({
      envPrefix: 'DOCUMENT_STORAGE',
      defaultFilesystemRoot: './local-documents',
    });
    const artifacts = createStorageConfig({
      envPrefix: 'TEST_ARTIFACT_STORAGE',
      defaultFilesystemRoot: './local-artifacts',
    });

    const getEnvironmentVariableNames = (definition: ReturnType<typeof createStorageConfig>) => [
      definition.driver.env,
      definition.drivers.filesystem.root.env,
      ...Object.values(definition.drivers.s3).map(({ env }) => env),
      ...Object.values(definition.drivers.azureBlob).map(({ env }) => env),
    ];

    expect(getEnvironmentVariableNames(documents)).toEqual([
      'DOCUMENT_STORAGE_DRIVER',
      'DOCUMENT_STORAGE_FILESYSTEM_ROOT',
      'DOCUMENT_STORAGE_S3_ACCESS_KEY_ID',
      'DOCUMENT_STORAGE_S3_SECRET_ACCESS_KEY',
      'DOCUMENT_STORAGE_S3_BUCKET_NAME',
      'DOCUMENT_STORAGE_S3_REGION',
      'DOCUMENT_STORAGE_S3_ENDPOINT',
      'DOCUMENT_STORAGE_S3_FORCE_PATH_STYLE',
      'DOCUMENT_STORAGE_AZURE_BLOB_CONNECTION_STRING',
      'DOCUMENT_STORAGE_AZURE_BLOB_ACCOUNT_NAME',
      'DOCUMENT_STORAGE_AZURE_BLOB_ACCOUNT_KEY',
      'DOCUMENT_STORAGE_AZURE_BLOB_CONTAINER_NAME',
    ]);
    expect(getEnvironmentVariableNames(artifacts)).toEqual([
      'TEST_ARTIFACT_STORAGE_DRIVER',
      'TEST_ARTIFACT_STORAGE_FILESYSTEM_ROOT',
      'TEST_ARTIFACT_STORAGE_S3_ACCESS_KEY_ID',
      'TEST_ARTIFACT_STORAGE_S3_SECRET_ACCESS_KEY',
      'TEST_ARTIFACT_STORAGE_S3_BUCKET_NAME',
      'TEST_ARTIFACT_STORAGE_S3_REGION',
      'TEST_ARTIFACT_STORAGE_S3_ENDPOINT',
      'TEST_ARTIFACT_STORAGE_S3_FORCE_PATH_STYLE',
      'TEST_ARTIFACT_STORAGE_AZURE_BLOB_CONNECTION_STRING',
      'TEST_ARTIFACT_STORAGE_AZURE_BLOB_ACCOUNT_NAME',
      'TEST_ARTIFACT_STORAGE_AZURE_BLOB_ACCOUNT_KEY',
      'TEST_ARTIFACT_STORAGE_AZURE_BLOB_CONTAINER_NAME',
    ]);

    expect(documents.drivers.filesystem.root.default).toBe('./local-documents');
    expect(artifacts.drivers.filesystem.root.default).toBe('./local-artifacts');
    expect(documents).not.toBe(artifacts);
    expect(documents.drivers).not.toBe(artifacts.drivers);
  });
});
