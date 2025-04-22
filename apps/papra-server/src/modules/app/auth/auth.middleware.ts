import type { ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Context } from '../server.types';
import { createMiddleware } from 'hono/factory';
import { createUnauthorizedError } from './auth.errors';
import { isAuthenticationValid } from './auth.models';

export function requireAuthentication({ apiKeyPermissions }: { apiKeyPermissions?: ApiKeyPermissions[] } = {}) {
  return createMiddleware(async (context: Context, next) => {
    const isAuthenticated = isAuthenticationValid({
      authType: context.get('authType'),
      session: context.get('session'),
      apiKey: context.get('apiKey'),
      requiredApiKeyPermissions: apiKeyPermissions,
    });

    if (!isAuthenticated) {
      throw createUnauthorizedError();
    }

    await next();
  });
}
