import { createErrorFactory } from '../shared/errors/errors';

export const createUserNotInOrganizationError = createErrorFactory({
  message: 'You are not part of this organization.',
  code: 'user.not_in_organization',
  statusCode: 403,
});
