import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentAlreadyHasTagError = createErrorFactory({
  message: 'Document already has tag',
  code: 'documents.already_has_tag',
  statusCode: 400,
});

export const createTagAlreadyExistsError = createErrorFactory({
  message: 'Tag already exists',
  code: 'tags.already_exists',
  statusCode: 400,
});
