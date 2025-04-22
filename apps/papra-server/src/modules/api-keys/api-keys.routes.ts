import type { RouteDefinitionContext } from '../app/server.types';
import type { ApiKeyPermissions } from './api-keys.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createError } from '../shared/errors/errors';
import { validateJsonBody } from '../shared/validation/validation';
import { API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';
import { createApiKeysRepository } from './api-keys.repository';
import { createApiKey } from './api-keys.usecases';

export function registerApiKeysRoutes(context: RouteDefinitionContext) {
  setupCreateApiKeyRoute(context);
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

function setupDeleteApiKeyRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/api-keys/:apiKeyId',
    requireAuthentication(),
    async (context) => {
      const { userId } = getUser({ context });
      const apiKeyRepository = createApiKeysRepository({ db });

      const { apiKeyId } = context.req.param();

      await apiKeyRepository.deleteUserApiKey({ apiKeyId, userId });

      return context.body(null, 204);
    },
  );
}
