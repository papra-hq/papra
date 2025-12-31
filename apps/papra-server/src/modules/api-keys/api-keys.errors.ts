import { createErrorFactory } from '../shared/errors/errors';

// Error when the authentication is not using an API key but the route is api-key only
export const createNotApiKeyAuthError = createErrorFactory({
  code: 'api_keys.authentication_not_api_key',
  message: 'Authentication must be done using an API key to access this resource',
  statusCode: 401,
});
