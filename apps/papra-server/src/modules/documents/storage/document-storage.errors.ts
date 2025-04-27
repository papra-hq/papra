import { createErrorFactory } from '../../shared/errors/errors';

export const createFileNotFoundError = createErrorFactory({
  message: 'File not found',
  code: 'documents.storage.file_not_found',
  statusCode: 404,
});
