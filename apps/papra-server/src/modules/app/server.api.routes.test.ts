import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createApiKeysRepository } from '../api-keys/api-keys.repository';
import { createApiKey } from '../api-keys/api-keys.usecases';
import { overrideConfig } from '../config/config.test-utils';
import { getPublicConfigContract } from '../config/config.api.contracts';
import { PERMISSIONS_BY_ROLE } from '../roles/roles.constants';
import { userRolesTable } from '../roles/roles.table';
import { getCurrentUserContract } from '../users/users.api.contracts';
import { createInMemoryDatabase } from './database/database.test-utils';
import { createServer } from './server';
import { createTestServerDependencies } from './server.test-utils';

async function createAuthenticatedServer() {
  const { db } = await createInMemoryDatabase();
  const dependencies = createTestServerDependencies({
    db,
    config: overrideConfig({ auth: { firstUserAsAdmin: false } }),
  });
  const { app } = createServer(dependencies);
  const {
    headers,
    response: { user },
  } = await dependencies.auth.api.signUpEmail({
    body: {
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      name: 'Alice',
    },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');

  return { app, db, user, headers: { Cookie: cookie } };
}

describe('contract API wiring', () => {
  test('the public config supports anonymous GET and HEAD requests', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db }));

    const response = await app.request('/api/config');
    const body = await response.json();

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(body).toMatchObject({
      config: {
        version: 'dev',
        gitCommitSha: 'unknown',
        gitCommitDate: 'unknown',
        documents: { isReprocessingEnabled: true },
      },
    });
    expect(
      v.parse(getPublicConfigContract.responses[200].content['application/json'].schema, body),
    ).toEqual(body);

    const headResponse = await app.request('/api/config', { method: 'HEAD' });

    expect(headResponse.status).toEqual(200);
    expect(headResponse.headers.get('Content-Type')).toEqual('application/json');
    expect(headResponse.body).toEqual(null);
    expect(await headResponse.text()).toEqual('');
  });

  test('session cookies authenticate the current-user endpoint and return its wire contract', async () => {
    const { app, db, user, headers } = await createAuthenticatedServer();
    await db.insert(userRolesTable).values({ userId: user.id, role: 'admin' });

    const response = await app.request('/api/users/me', { headers });
    const body = await response.json();

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(body).toEqual({
      user: {
        id: user.id,
        email: 'alice@example.com',
        name: 'Alice',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        twoFactorEnabled: false,
        permissions: PERMISSIONS_BY_ROLE.admin,
      },
    });
    expect(
      v.safeParse(getCurrentUserContract.responses[200].content['application/json'].schema, body)
        .success,
    ).toEqual(true);
  });

  test('HEAD requests reach migrated GET routes and return only their status and headers', async () => {
    const { app, headers } = await createAuthenticatedServer();

    const response = await app.request('/api/users/me', { method: 'HEAD', headers });

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.body).toEqual(null);
    expect(await response.text()).toEqual('');
  });

  test('HEAD requests to migrated routes still require authentication', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db }));

    const response = await app.request('/api/users/me', { method: 'HEAD' });

    expect(response.status).toEqual(401);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('unmatched HEAD requests continue to legacy GET routes', async () => {
    const { app, headers } = await createAuthenticatedServer();

    const response = await app.request('/api/api-keys', { method: 'HEAD', headers });

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.body).toEqual(null);
  });

  test('unknown HEAD paths reach the existing not-found handler without a body', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db }));

    const response = await app.request('/api/missing', { method: 'HEAD' });

    expect(response.status).toEqual(404);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.body).toEqual(null);
  });

  test('the current-user endpoint rejects requests without credentials', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db }));

    const response = await app.request('/api/users/me');

    expect(response.status).toEqual(401);
    expect(await response.json()).toEqual({
      error: { message: 'Unauthorized', code: 'auth.unauthorized' },
    });
  });

  test('the current-user endpoint does not accept an API key in place of a session', async () => {
    const { db } = await createInMemoryDatabase({
      users: [{ id: 'usr_alice', email: 'alice@example.com' }],
    });
    const { token } = await createApiKey({
      apiKeyRepository: createApiKeysRepository({ db }),
      name: 'Test key',
      userId: 'usr_alice',
      permissions: [],
      organizationIds: [],
      allOrganizations: true,
    });
    const { app } = createServer(createTestServerDependencies({ db }));

    const response = await app.request('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toEqual(401);
    expect(await response.json()).toEqual({
      error: { message: 'Unauthorized', code: 'auth.unauthorized' },
    });
  });
});
