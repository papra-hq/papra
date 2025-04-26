import type { Document } from '../../documents/documents.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

describe('api-key e2e', () => {
  test('one can create a document using an api key', async () => {
    const { db } = await createInMemoryDatabase({
      users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
      organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
      organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
    });

    const { app } = await createServer({
      db,
      config: overrideConfig({
        env: 'test',
        documentsStorage: {
          driver: 'in-memory',
        },
      }),
    });

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
    const { token } = await createApiKeyResponse.json() as { token: string };

    const formData = new FormData();
    formData.append('file', new File(['test'], 'invoice.txt', { type: 'text/plain' }));
    const bodyResponse = new Response(formData);

    const createDocumentResponse = await app.request('/api/organizations/org_222222222222222222222222/documents', {
      method: 'POST',
      headers: {
        ...Object.fromEntries(bodyResponse.headers.entries()),
        Authorization: `Bearer ${token}`,
      },
      body: await bodyResponse.arrayBuffer(),
    });

    expect(createDocumentResponse.status).toBe(200);
    const { document } = await createDocumentResponse.json() as { document: Document };

    expect(document).to.deep.include({
      isDeleted: false,
      deletedAt: null,
      organizationId: 'org_222222222222222222222222',
      createdBy: 'usr_111111111111111111111111',
      deletedBy: null,
      originalName: 'invoice.txt',
      originalSize: 4,
      originalSha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      name: 'invoice.txt',
      mimeType: 'text/plain',
      content: 'test',
    });

    const fetchDocumentResponse = await app.request(`/api/organizations/org_222222222222222222222222/documents/${document.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // The api key is not authorized to read the document, only documents:create is granted
    expect(fetchDocumentResponse.status).toBe(401);
    expect(await fetchDocumentResponse.json()).to.eql({
      error: {
        code: 'auth.unauthorized',
        message: 'Unauthorized',
      },
    });
  });
});
