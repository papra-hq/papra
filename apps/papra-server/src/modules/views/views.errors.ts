import { createErrorFactory } from '../shared/errors/errors';

export const createViewNotFoundError = createErrorFactory({
  message: 'View not found',
  code: 'views.not_found',
  statusCode: 404,
});

export const createViewAlreadyExistsError = createErrorFactory({
  message: 'A view with this name already exists',
  code: 'views.already_exists',
  statusCode: 400,
});
