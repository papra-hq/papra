import { createErrorFactory } from '../../shared/errors/errors';

export const createFileNotFoundError = createErrorFactory({
  message: 'File not found',
  code: 'documents.storage.file_not_found',
  statusCode: 404,
});

export const createFileAlreadyExistsInStorageError = createErrorFactory({
  message: 'File already exists',
  code: 'documents.storage.file_already_exists',
  statusCode: 409,
});

export const createUnableToFindAvailableStorageKeyError = createErrorFactory({
  message: 'Unable to find available storage key',
  code: 'documents.storage.unable_to_find_available_storage_key',
  statusCode: 500,
  isInternal: true,
});
