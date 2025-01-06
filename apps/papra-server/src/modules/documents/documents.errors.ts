import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentNotFoundError = createErrorFactory({
  message: 'Document not found.',
  code: 'document.not_found',
  statusCode: 404,
});
