import { createErrorFactory } from '../shared/errors/errors';

export const createIntakeEmailMissingWebhookSecretError = createErrorFactory({
  message:
    'Intake emails are enabled, but the intake email webhook secret is not set. Please set the INTAKE_EMAILS_WEBHOOK_SECRET environment variable.',
  code: 'intake_email.missing_webhook_secret',
  statusCode: 500,
});

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
