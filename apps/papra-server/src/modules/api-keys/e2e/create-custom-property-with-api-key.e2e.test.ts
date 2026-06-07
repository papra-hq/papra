import type { CustomPropertyDefinition } from '../../custom-properties/custom-properties.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

const USER_ID = 'usr_111111111111111111111111';
const ORG_ID = 'org_222222222222222222222222';

describe('custom-property api-key e2e', () => {
  test('one can create a custom property definition using an api key with the custom-properties:create permission', async () => {
    const { db } = await createInMemoryDatabase({
      users: [{ id: USER_ID, email: 'user@example.com' }],
      organizations: [{ id: ORG_ID, name: 'Org 1' }],
      organizationMembers: [{ organizationId: ORG_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
    });

    const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

    const createApiKeyResponse = await app.request(
      '/api/api-keys',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test API Key',
          permissions: ['custom-properties:create'],
        }),
      },
      { loggedInUserId: USER_ID },
    );

    expect(createApiKeyResponse.status).toBe(200);
    const { token } = await createApiKeyResponse.json() as { token: string };

    const createResponse = await app.request(`/api/organizations/${ORG_ID}/custom-properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
    });

    expect(createResponse.status).toBe(200);
    const { propertyDefinition } = await createResponse.json() as { propertyDefinition: CustomPropertyDefinition };

    expect(propertyDefinition).to.include({
      organizationId: ORG_ID,
      name: 'Invoice Number',
      key: 'invoicenumber',
      type: 'text',
    });

    // The api key is not authorized to read definitions, only custom-properties:create is granted
    const listResponse = await app.request(`/api/organizations/${ORG_ID}/custom-properties`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(listResponse.status).toBe(401);
    expect(await listResponse.json()).to.eql({
      error: {
        code: 'auth.unauthorized',
        message: 'Unauthorized',
      },
    });
  });

  test('without the custom-properties:create permission, creating a custom property definition with an api key should fail', async () => {
    const { db } = await createInMemoryDatabase({
      users: [{ id: USER_ID, email: 'user@example.com' }],
      organizations: [{ id: ORG_ID, name: 'Org 1' }],
      organizationMembers: [{ organizationId: ORG_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
    });

    const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

    const createApiKeyResponse = await app.request(
      '/api/api-keys',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test API Key',
          permissions: ['documents:create'], // at least one permission is required
        }),
      },
      { loggedInUserId: USER_ID },
    );

    expect(createApiKeyResponse.status).toBe(200);
    const { token } = await createApiKeyResponse.json() as { token: string };

    const createResponse = await app.request(`/api/organizations/${ORG_ID}/custom-properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
    });

    expect(createResponse.status).toBe(401);
    expect(await createResponse.json()).to.eql({
      error: {
        code: 'auth.unauthorized',
        message: 'Unauthorized',
      },
    });
  });
});
