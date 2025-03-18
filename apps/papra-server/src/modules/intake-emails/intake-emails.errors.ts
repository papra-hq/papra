import { createErrorFactory } from '../shared/errors/errors';

export const createIntakeEmailLimitReachedError = createErrorFactory({
  message: 'The maximum number of intake emails for this organization has been reached.',
  code: 'intake_email.limit_reached',
  statusCode: 403,
});
