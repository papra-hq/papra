import type { Database } from '../app/database/database.types';
import type { Context } from '../app/server.types';
import { createMiddleware } from 'hono/factory';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { getAuthorizationHeader } from '../shared/headers/headers.models';
import { createApiKeysRepository } from './api-keys.repository';
import { getApiKey } from './api-keys.usecases';

// The role of this middleware is to extract the api key from the authorization header if present
// and set it on the context, no auth enforcement is done here
export function createApiKeyMiddleware({ db }: { db: Database }) {
  const apiKeyRepository = createApiKeysRepository({ db });

  return createMiddleware(async (context: Context, next) => {
    const { authorizationHeader } = getAuthorizationHeader({ context });

    if (!authorizationHeader) {
      return next();
    }

    const parts = authorizationHeader.split(' ');

    if (parts.length !== 2) {
      throw createUnauthorizedError();
    }

    const [maybeBearer, token] = parts;

    if (maybeBearer !== 'Bearer') {
      throw createUnauthorizedError();
    }

    const { apiKey } = await getApiKey({ token, apiKeyRepository });

    if (apiKey) {
      context.set('apiKey', apiKey);
      context.set('userId', apiKey.userId);
      context.set('authType', 'api-key');
    }

    await next();
  });
}
