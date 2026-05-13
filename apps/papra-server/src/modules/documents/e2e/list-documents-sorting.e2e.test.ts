import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

const USER_ID = 'usr_111111111111111111111111';
const ORGANIZATION_ID = 'org_222222222222222222222222';

function makeDocument({ id, name, createdAt }: { id: string; name: string; createdAt: Date }) {
  return {
    id,
    name,
    content: '',
    organizationId: ORGANIZATION_ID,
    mimeType: 'text/plain',
    originalName: name,
    createdAt,
    updatedAt: createdAt,
    createdBy: USER_ID,
    originalStorageKey: `documents/${id}`,
    originalSha256Hash: `hash${id}`,
    isDeleted: false,
  };
}

async function listDocuments({ query = '' }: { query?: string } = {}) {
  const { db } = await createInMemoryDatabase({
    users: [{ id: USER_ID, email: 'user@example.com' }],
    organizations: [{ id: ORGANIZATION_ID, name: 'Org 1' }],
    organizationMembers: [{ organizationId: ORGANIZATION_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
    documents: [
      makeDocument({ id: 'doc_111111111111111111111111', name: 'banana.txt', createdAt: new Date('2026-01-03') }),
      makeDocument({ id: 'doc_222222222222222222222222', name: 'apple.txt', createdAt: new Date('2026-01-01') }),
      makeDocument({ id: 'doc_333333333333333333333333', name: 'Cherry.txt', createdAt: new Date('2026-01-02') }),
    ],
  });

  const { app } = createServer(createTestServerDependencies({
    db,
    config: overrideConfig({ env: 'test' }),
  }));

  const response = await app.request(
    `/api/organizations/${ORGANIZATION_ID}/documents${query}`,
    {},
    { loggedInUserId: USER_ID },
  );

  const body = response.status === 200
    ? (await response.json()) as { documents: { name: string }[]; documentsCount: number }
    : undefined;

  return { status: response.status, documentNames: body?.documents.map(document => document.name) };
}

describe('documents e2e', () => {
  describe('list documents sorting', () => {
    test('documents are sorted by creation date, most recent first, by default', async () => {
      const { status, documentNames } = await listDocuments();

      expect(status).to.eql(200);
      expect(documentNames).to.eql(['banana.txt', 'Cherry.txt', 'apple.txt']);
    });

    test('documents can be sorted by name ascending, case-insensitively', async () => {
      const { status, documentNames } = await listDocuments({ query: '?sortField=name&sortOrder=asc' });

      expect(status).to.eql(200);
      expect(documentNames).to.eql(['apple.txt', 'banana.txt', 'Cherry.txt']);
    });

    test('documents can be sorted by name descending', async () => {
      const { status, documentNames } = await listDocuments({ query: '?sortField=name&sortOrder=desc' });

      expect(status).to.eql(200);
      expect(documentNames).to.eql(['Cherry.txt', 'banana.txt', 'apple.txt']);
    });

    test('an unknown sort field is rejected', async () => {
      const { status } = await listDocuments({ query: '?sortField=size' });

      expect(status).to.eql(400);
    });
  });
});
