import type { Database } from '../app/database/database.types';
import type { Context } from '../app/server.types';
import { createMiddleware } from 'hono/factory';
import { addLogContext } from '../shared/logger/logger';
import { buildGetApiKeyFromHeaders } from './api-keys.authentication';
import { createApiKeysRepository } from './api-keys.repository';
import { getApiKey } from './api-keys.usecases';

// The role of this middleware is to extract the api key from the authorization header if present
// and set it on the context, no auth enforcement is done here
export function createApiKeyMiddleware({ db }: { db: Database }) {
  const apiKeyRepository = createApiKeysRepository({ db });
  const getApiKeyFromHeaders = buildGetApiKeyFromHeaders({
    lookupApiKeyByToken: async ({ token }) => {
      const { apiKey } = await getApiKey({ token, apiKeyRepository });
      return apiKey ?? null;
    },
  });

  return createMiddleware(async (context: Context, next) => {
    const apiKey = await getApiKeyFromHeaders({ headers: context.req.raw.headers });

    if (apiKey) {
      const userId = apiKey.userId;
      const authType = 'api-key';

      context.set('apiKey', apiKey);
      context.set('userId', userId);
      context.set('authType', authType);

      addLogContext({ userId, authType, apiKeyId: apiKey.id });
    }

    await next();
  });
}
