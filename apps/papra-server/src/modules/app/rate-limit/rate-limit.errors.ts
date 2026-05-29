import { createErrorFactory } from '../../shared/errors/errors';

export const createTooManyRequestsError = createErrorFactory({
  message: 'Too many requests',
  code: 'server.too_many_requests',
  statusCode: 429,
});
