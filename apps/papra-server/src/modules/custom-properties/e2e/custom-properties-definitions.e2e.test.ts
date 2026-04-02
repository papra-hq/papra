import type { CustomPropertyDefinition } from '../custom-properties.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

const USER_ID = 'usr_111111111111111111111111';
const ORG_ID = 'org_222222222222222222222222';

async function setupApp() {
  const { db } = await createInMemoryDatabase({
    users: [{ id: USER_ID, email: 'user@example.com' }],
    organizations: [{ id: ORG_ID, name: 'Org 1' }],
    organizationMembers: [{ organizationId: ORG_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
  });

  const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

  return { db, app };
}

describe('custom properties e2e', () => {
  describe('property definitions', () => {
    test('can create a property definition', async () => {
      const { app } = await setupApp();

      const response = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(200);

      const { propertyDefinition } = await response.json() as { propertyDefinition: CustomPropertyDefinition };

      expect(propertyDefinition).to.include({
        organizationId: ORG_ID,
        name: 'Invoice Number',
        key: 'invoicenumber',
        type: 'text',
      });
    });

    test('can list property definitions for an organization', async () => {
      const { app } = await setupApp();

      await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );

      const response = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(200);

      const { propertyDefinitions } = await response.json() as { propertyDefinitions: CustomPropertyDefinition[] };

      expect(propertyDefinitions).to.have.length(1);
      expect(propertyDefinitions[0]).to.include({ key: 'invoicenumber', name: 'Invoice Number' });
    });

    test('can get a single property definition', async () => {
      const { app } = await setupApp();

      const createResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );
      const { propertyDefinition } = await createResponse.json() as { propertyDefinition: CustomPropertyDefinition };

      const response = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties/${propertyDefinition.id}`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(200);

      const { definition } = await response.json() as { definition: CustomPropertyDefinition };

      expect(definition).to.include({ id: propertyDefinition.id, key: 'invoicenumber' });
    });

    test('can update a property definition', async () => {
      const { app } = await setupApp();

      const createResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );
      const { propertyDefinition } = await createResponse.json() as { propertyDefinition: CustomPropertyDefinition };

      const updateResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties/${propertyDefinition.id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Invoice No.' }) },
        { loggedInUserId: USER_ID },
      );

      expect(updateResponse.status).to.eql(200);

      const { propertyDefinition: updated } = await updateResponse.json() as { propertyDefinition: CustomPropertyDefinition };

      expect(updated).to.include({ name: 'Invoice No.', key: 'invoiceno' });
    });

    test('can delete a property definition', async () => {
      const { app } = await setupApp();

      const createResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );
      const { propertyDefinition } = await createResponse.json() as { propertyDefinition: CustomPropertyDefinition };

      const deleteResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties/${propertyDefinition.id}`,
        { method: 'DELETE' },
        { loggedInUserId: USER_ID },
      );

      expect(deleteResponse.status).to.eql(200);

      const listResponse = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );
      const { propertyDefinitions } = await listResponse.json() as { propertyDefinitions: CustomPropertyDefinition[] };

      expect(propertyDefinitions).to.have.length(0);
    });

    test('two property definitions with the same key in the same organization are rejected', async () => {
      const { app } = await setupApp();

      await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'text' }),
        },
        { loggedInUserId: USER_ID },
      );

      const response = await app.request(
        `/api/organizations/${ORG_ID}/custom-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Invoice Number', type: 'number' }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(409);
    });
  });
});
