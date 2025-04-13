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

export const DOCUMENT_ALREADY_EXISTS_ERROR_CODE = 'document.already_exists' as const;
export const createDocumentAlreadyExistsError = createErrorFactory({
  message: 'Document already exists.',
  code: DOCUMENT_ALREADY_EXISTS_ERROR_CODE,
  statusCode: 409,
});

export const createDocumentNotDeletedError = createErrorFactory({
  message: 'Document is not deleted, cannot delete.',
  code: 'document.not_deleted',
  statusCode: 400,
});
