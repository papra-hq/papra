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
