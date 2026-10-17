import { createErrorFactory } from '../shared/errors/errors';

export const createDocumentAlreadyHasTagError = createErrorFactory({
  message: 'Document already has tag',
  code: 'documents.already_has_tag',
  statusCode: 409,
});

export const createTagAlreadyExistsError = createErrorFactory({
  message: 'Tag already exists',
  code: 'tags.already_exists',
  statusCode: 409,
});

export const createTagCreationFailedError = createErrorFactory({
  message: 'Tag creation did not return a tag',
  code: 'tags.creation_failed',
  statusCode: 500,
  isInternal: true,
});

export const tagNotFoundErrorDefinition = {
  message: 'Tag not found',
  code: 'tags.not_found',
  statusCode: 404,
} as const;

export const createTagNotFoundError = createErrorFactory(tagNotFoundErrorDefinition);

export const createOrganizationTagLimitReachedError = createErrorFactory({
  message: 'The maximum number of tags for this organization has been reached.',
  code: 'tags.organization_limit_reached',
  statusCode: 403,
});
