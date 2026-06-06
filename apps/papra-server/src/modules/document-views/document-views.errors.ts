import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentViewNotFoundError = createErrorFactory({
  message: 'Document view not found',
  code: 'document_views.not_found',
  statusCode: 404,
});

export const createDocumentViewAlreadyExistsError = createErrorFactory({
  message: 'A document view with this name already exists',
  code: 'document_views.already_exists',
  statusCode: 400,
});
