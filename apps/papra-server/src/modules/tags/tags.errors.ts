import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentAlreadyHasTagError = createErrorFactory({
  message: 'Document already has tag',
  code: 'documents.already_has_tag',
  statusCode: 400,
});
