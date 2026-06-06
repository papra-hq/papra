import { createErrorFactory } from '../shared/errors/errors';

export const createUsersNotFoundError = createErrorFactory({
  message: 'User not found',
  code: 'users.not_found',
  statusCode: 404,
});

export const createUserAlreadyExistsError = createErrorFactory({
  message: 'User already exists',
  code: 'users.create_user_already_exists',
  statusCode: 400,
});

export const createCustomerIdNotFoundError = createErrorFactory({
  message: 'Customer ID not found',
  code: 'users.customer_id_not_found',
  statusCode: 404,
});

export const createUserAccountCreationDisabledError = createErrorFactory({
  message: 'User account creation is disabled',
  code: 'users.create_account_disabled',
  statusCode: 403,
});

export const createUserStillOwnsOrganizationsError = createErrorFactory({
  message: 'User still owns organizations',
  code: 'users.still_owns_organizations',
  statusCode: 400,
});

export const createCannotDeleteSelfError = createErrorFactory({
  message: 'Cannot delete your own account from the admin panel',
  code: 'users.cannot_delete_self',
  statusCode: 400,
});
