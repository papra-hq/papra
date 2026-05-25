import type { DocumentCustomPropertyForApi } from '../custom-properties.models';
import type { CustomPropertyDefinition } from '../custom-properties.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

const USER_ID = 'usr_111111111111111111111111';
const ORG_ID = 'org_222222222222222222222222';
const DOC_ID = 'doc_333333333333333333333333';

const BASE_DOCUMENT = {
  id: DOC_ID,
  organizationId: ORG_ID,
  name: 'invoice.txt',
  originalName: 'invoice.txt',
  mimeType: 'text/plain',
  originalStorageKey: 'org/originals/invoice.txt',
  originalSha256Hash: 'hash',
};

async function setupApp() {
  const { db } = await createInMemoryDatabase({
    users: [{ id: USER_ID, email: 'user@example.com' }],
    organizations: [{ id: ORG_ID, name: 'Org 1' }],
    organizationMembers: [{ organizationId: ORG_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
    documents: [BASE_DOCUMENT],
  });

  const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

  return { db, app };
}

describe('custom properties e2e', () => {
  describe('document custom property values', () => {
    test('can set a custom property value on a document', async () => {
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

      const setResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}/custom-properties/${propertyDefinition.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: 'INV-001' }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(setResponse.status).to.eql(204);

      const getResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );
      const { document } = await getResponse.json() as { document: { customProperties: DocumentCustomPropertyForApi[] } };

      expect(document.customProperties).to.eql([
        { key: 'invoicenumber', name: 'Invoice Number', type: 'text', displayOrder: 0, value: 'INV-001' },
      ]);
    });

    test('setting a value twice overwrites it', async () => {
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

      await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}/custom-properties/${propertyDefinition.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: 'INV-001' }),
        },
        { loggedInUserId: USER_ID },
      );

      await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}/custom-properties/${propertyDefinition.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: 'INV-002' }),
        },
        { loggedInUserId: USER_ID },
      );

      const getResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );
      const { document } = await getResponse.json() as { document: { customProperties: DocumentCustomPropertyForApi[] } };

      expect(document.customProperties[0]?.value).to.eql('INV-002');
    });

    test('can delete a custom property value from a document, it shows as null in the document', async () => {
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

      await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}/custom-properties/${propertyDefinition.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: 'INV-001' }),
        },
        { loggedInUserId: USER_ID },
      );

      const deleteResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}/custom-properties/${propertyDefinition.id}`,
        { method: 'DELETE' },
        { loggedInUserId: USER_ID },
      );

      expect(deleteResponse.status).to.eql(204);

      const getResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );
      const { document } = await getResponse.json() as { document: { customProperties: DocumentCustomPropertyForApi[] } };

      expect(document.customProperties).to.eql([
        { key: 'invoicenumber', name: 'Invoice Number', type: 'text', displayOrder: 0, value: null },
      ]);
    });

    test('a defined property with no value set shows as null in the document', async () => {
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

      const getResponse = await app.request(
        `/api/organizations/${ORG_ID}/documents/${DOC_ID}`,
        { method: 'GET' },
        { loggedInUserId: USER_ID },
      );
      const { document } = await getResponse.json() as { document: { customProperties: DocumentCustomPropertyForApi[] } };

      expect(document.customProperties).to.eql([
        { key: 'invoicenumber', name: 'Invoice Number', type: 'text', displayOrder: 0, value: null },
      ]);
    });
  });
});
