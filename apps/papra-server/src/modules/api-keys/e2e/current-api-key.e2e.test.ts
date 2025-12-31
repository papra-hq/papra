import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { API_KEY_ID_PREFIX, API_KEY_TOKEN_LENGTH } from '../api-keys.constants';

describe('api-key e2e', () => {
  describe('get /api/api-keys/current', () => {
    test('when using an api key, one can request the /api/api-keys/current route to check that the api key is valid', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
        organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
        organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
      });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            driver: 'in-memory',
          },
        }),
      }));

      const createApiKeyResponse = await app.request(
        '/api/api-keys',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test API Key',
            permissions: ['documents:create'],
          }),
        },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(createApiKeyResponse.status).toBe(200);
      const { token, apiKey } = await createApiKeyResponse.json() as { token: string; apiKey: { id: string } };

      const getCurrentApiKeyResponse = await app.request(
        '/api/api-keys/current',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const response = await getCurrentApiKeyResponse.json();

      expect(response).to.deep.equal({
        apiKey: {
          id: apiKey.id,
          name: 'Test API Key',
          permissions: ['documents:create'],
        },
      });

      expect(getCurrentApiKeyResponse.status).toBe(200);
    });

    test('when not using an api key, requesting the /api/api-keys/current route returns an error', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
        organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
        organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
      });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            driver: 'in-memory',
          },
        }),
      }));

      const getCurrentApiKeyResponse = await app.request(
        '/api/api-keys/current',
        {
          method: 'GET',
        },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(getCurrentApiKeyResponse.status).toBe(401);
      const response = await getCurrentApiKeyResponse.json();

      expect(response).to.deep.equal({
        error: {
          code: 'api_keys.authentication_not_api_key',
          message: 'Authentication must be done using an API key to access this resource',
        },
      });
    });

    test('when not authenticated at all, requesting the /api/api-keys/current route returns an error', async () => {
      const { db } = await createInMemoryDatabase();

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            driver: 'in-memory',
          },
        }),
      }));

      const getCurrentApiKeyResponse = await app.request(
        '/api/api-keys/current',
        {
          method: 'GET',
        },
      );

      expect(getCurrentApiKeyResponse.status).toBe(401);
      const response = await getCurrentApiKeyResponse.json();

      expect(response).to.deep.equal({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });

    test('if the api key used is invalid, requesting the /api/api-keys/current route returns an error', async () => {
      const { db } = await createInMemoryDatabase();
      const invalidButLegitApiKeyToken = `${API_KEY_ID_PREFIX}_${'x'.repeat(API_KEY_TOKEN_LENGTH)}`;

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            driver: 'in-memory',
          },
        }),
      }));

      const getCurrentApiKeyResponse = await app.request(
        '/api/api-keys/current',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${invalidButLegitApiKeyToken}`,
          },
        },
      );

      expect(getCurrentApiKeyResponse.status).toBe(401);
      const response = await getCurrentApiKeyResponse.json();

      expect(response).to.deep.equal({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });
});
