import { createErrorFactory } from '../../shared/errors/errors';

export const createUnauthorizedError = createErrorFactory({
  message: 'Unauthorized',
  code: 'auth.unauthorized',
  statusCode: 401,
});

export const createForbiddenError = createErrorFactory({
  message: 'Forbidden',
  code: 'auth.forbidden',
  statusCode: 403,
});
