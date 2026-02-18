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
