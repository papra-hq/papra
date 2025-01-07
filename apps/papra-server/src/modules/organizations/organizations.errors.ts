import { createErrorFactory } from '../shared/errors/errors';

export const createUserNotInOrganizationError = createErrorFactory({
  message: 'You are not part of this organization.',
  code: 'user.not_in_organization',
  statusCode: 403,
});

export const createOrganizationNotFoundError = createErrorFactory({
  message: 'Organization not found.',
  code: 'organization.not_found',
  statusCode: 404,
});
