import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentNotFoundError = createErrorFactory({
  message: 'Document not found.',
  code: 'document.not_found',
  statusCode: 404,
});

export const createDocumentIsNotDeletedError = createErrorFactory({
  message: 'Document is not deleted, cannot restore.',
  code: 'document.not_deleted',
  statusCode: 400,
});

export const createDocumentAlreadyExistsError = createErrorFactory({
  message: 'Document already exists.',
  code: 'document.already_exists',
  statusCode: 409,
});
