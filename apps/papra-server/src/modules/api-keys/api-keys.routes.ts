import type { RouteDefinitionContext } from '../app/server.types';
import type { ApiKeyPermissions } from './api-keys.types';
import { z } from 'zod';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createError } from '../shared/errors/errors';
import { isNil } from '../shared/utils';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';
import { createNotApiKeyAuthError } from './api-keys.errors';
import { createApiKeysRepository } from './api-keys.repository';
import { apiKeyIdSchema } from './api-keys.schemas';
import { createApiKey } from './api-keys.usecases';

export function registerApiKeysRoutes(context: RouteDefinitionContext) {
  setupCreateApiKeyRoute(context);
  setupGetCurrentApiKeyRoute(context); // Should be before the get api keys route otherwise it conflicts ("current" as apiKeyId)
  setupGetApiKeysRoute(context);
  setupDeleteApiKeyRoute(context);
}

function setupCreateApiKeyRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/api-keys',
    requireAuthentication(),
    validateJsonBody(
      z.object({
        name: z.string(),
        permissions: z.array(z.enum(API_KEY_PERMISSIONS_VALUES as [ApiKeyPermissions, ...ApiKeyPermissions[]])).min(1),
        organizationIds: z.array(z.string()).default([]),
        allOrganizations: z.boolean().default(false),
        expiresAt: z.date().optional(),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const apiKeyRepository = createApiKeysRepository({ db });

      const {
        name,
        permissions,
        organizationIds,
        allOrganizations,
        expiresAt,
      } = context.req.valid('json');

      if (allOrganizations && organizationIds.length > 0) {
        throw createError({
          code: 'api_keys.invalid_organization_ids',
          message: 'No organizationIds should be provided if allOrganizations is true',
          statusCode: 400,
        });
      }

      const { apiKey, token } = await createApiKey({
        name,
        permissions,
        organizationIds,
        allOrganizations,
        expiresAt,
        userId,
        apiKeyRepository,
      });

      return context.json({
        apiKey,
        token,
      });
    },
  );
}

function setupGetApiKeysRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/api-keys',
    requireAuthentication(),
    async (context) => {
      const { userId } = getUser({ context });
      const apiKeyRepository = createApiKeysRepository({ db });

      const { apiKeys } = await apiKeyRepository.getUserApiKeys({ userId });

      return context.json({ apiKeys });
    },
  );
}

// Mainly use for authentication verification in client SDKs
function setupGetCurrentApiKeyRoute({ app }: RouteDefinitionContext) {
  app.get(
    '/api/api-keys/current',
    async (context) => {
      const authType = context.get('authType');
      const apiKey = context.get('apiKey');

      if (isNil(authType)) {
        throw createUnauthorizedError();
      }

      if (authType !== 'api-key') {
        throw createNotApiKeyAuthError();
      }

      if (isNil(apiKey)) {
        // Should not happen as authType is 'api-key', but for type safety
        throw createUnauthorizedError();
      }

      return context.json({
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          permissions: apiKey.permissions,
        },
      });
    },
  );
}

function setupDeleteApiKeyRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/api-keys/:apiKeyId',
    requireAuthentication(),
    validateParams(z.object({
      apiKeyId: apiKeyIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const apiKeyRepository = createApiKeysRepository({ db });

      const { apiKeyId } = context.req.valid('param');

      await apiKeyRepository.deleteUserApiKey({ apiKeyId, userId });

      return context.body(null, 204);
    },
  );
}
