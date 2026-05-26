import { createErrorFactory } from '../shared/errors/errors';

export const createIntakeEmailLimitReachedError = createErrorFactory({
  message: 'The maximum number of intake emails for this organization has been reached.',
  code: 'intake_email.limit_reached',
  statusCode: 403,
});

export const createIntakeEmailNotFoundError = createErrorFactory({
  message: 'Intake email not found',
  code: 'intake_email.not_found',
  statusCode: 404,
});

export const createIntakeEmailAlreadyExistsError = createErrorFactory({
  message: 'Intake email already exists',
  code: 'intake_email.already_exists',
  statusCode: 400,
});

export const createIntakeEmailUsernameNotAcceptedByStrategyError = createErrorFactory({
  message: 'The configured intake email username strategy does not accept a user-provided username',
  code: 'intake_email.username_not_accepted_by_strategy',
  statusCode: 400,
});

export const createIntakeEmailUsernameRequiredByStrategyError = createErrorFactory({
  message: 'The configured intake email username strategy requires a user-provided username',
  code: 'intake_email.username_required_by_strategy',
  statusCode: 400,
});

export const createIntakeEmailUsernameUpdateNotSupportedError = createErrorFactory({
  message: 'Updating the intake email username is not supported by the configured strategy',
  code: 'intake_email.username_update_not_supported',
  statusCode: 400,
});

export const createIntakeEmailUsernameDeniedError = createErrorFactory({
  message: 'The provided intake email username is not allowed',
  code: 'intake_email.username_denied',
  statusCode: 400,
});

export const createInvalidIntakeEmailUsernameError = createErrorFactory({
  message: 'The provided intake email username is invalid',
  code: 'intake_email.invalid_username',
  statusCode: 400,
});

export const createIntakeEmailUpdateFailedError = createErrorFactory({
  message: 'Failed to update intake email address',
  code: 'intake_email.update_email_address_failed',
  statusCode: 500,
  isInternal: true,
});

export const createIntakeEmailUpdateNotSupportedByDriverError = createErrorFactory({
  message: 'Updating an intake email address is not supported by the active email driver',
  code: 'intake_email.update_not_supported_by_driver',
  statusCode: 400,
});
