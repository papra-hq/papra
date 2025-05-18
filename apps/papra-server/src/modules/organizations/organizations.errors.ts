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

export const createUserMaxOrganizationCountReachedError = createErrorFactory({
  message: 'You have reached the maximum number of organizations.',
  code: 'user.max_organization_count_reached',
  statusCode: 403,
});

export const createOrganizationDocumentStorageLimitReachedError = createErrorFactory({
  message: 'You have reached the maximum number of documents.',
  code: 'organization.document_storage_limit_reached',
  statusCode: 403,
});

export const createUserNotOrganizationOwnerError = createErrorFactory({
  message: 'You are not the owner of this organization.',
  code: 'user.not_organization_owner',
  statusCode: 403,
});

export const createUserOrganizationInvitationLimitReachedError = createErrorFactory({
  message: 'You have reached the maximum number of invitations.',
  code: 'user.organization_invitation_limit_reached',
  statusCode: 429,
});

export const createOrganizationInvitationAlreadyExistsError = createErrorFactory({
  message: 'An invitation for this email already exists.',
  code: 'organization.invitation_already_exists',
  statusCode: 400,
});

export const createUserAlreadyInOrganizationError = createErrorFactory({
  message: 'This user is already in this organization.',
  code: 'user.already_in_organization',
  statusCode: 400,
});
