import { getTableColumns } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { pick } from '../../shared/objects';
import { createDocumentSearchRepository } from '../document-search/database-fts5/database-fts5.repository';
import { documentsTable } from '../documents.table';

const USER_ID = 'usr_111111111111111111111111';
const ORGANIZATION_ID = 'org_222222222222222222222222';

function makeDocument(props: { id: string; name: string; content?: string }) {
  return {
    ...props,
    content: props.content ?? '',
    organizationId: ORGANIZATION_ID,
    mimeType: 'text/plain',
    originalName: props.name,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: USER_ID,
    originalStorageKey: `documents/${props.id}`,
    originalSha256Hash: `hash${props.id}`,
    isDeleted: false,
  };
}

describe('documents e2e', () => {
  describe('batch trash', () => {
    test('batch-trashes documents by id, leaving non-targeted documents untouched', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: USER_ID, email: 'user@example.com' }],
        organizations: [{ id: ORGANIZATION_ID, name: 'Org 1' }],
        organizationMembers: [{ organizationId: ORGANIZATION_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
        documents: [
          makeDocument({ id: 'doc_111111111111111111111111', name: 'invoice-1.txt' }),
          makeDocument({ id: 'doc_222222222222222222222222', name: 'invoice-2.txt' }),
          makeDocument({ id: 'doc_333333333333333333333333', name: 'memo.txt' }),
        ],
      });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({ env: 'test' }),
      }));

      const response = await app.request(
        `/api/organizations/${ORGANIZATION_ID}/documents/batch/trash`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filter: { documentIds: ['doc_111111111111111111111111', 'doc_222222222222222222222222'] } }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(204);

      const records = await db
        .select(pick(getTableColumns(documentsTable), ['id', 'isDeleted', 'deletedBy']))
        .from(documentsTable)
        .orderBy(documentsTable.id);

      expect(
        records,
      ).to.eql([
        { id: 'doc_111111111111111111111111', isDeleted: true, deletedBy: USER_ID },
        { id: 'doc_222222222222222222222222', isDeleted: true, deletedBy: USER_ID },
        { id: 'doc_333333333333333333333333', isDeleted: false, deletedBy: null },
      ]);
    });

    test('batch-trashes all documents matching a search query', async () => {
      const documents = [
        makeDocument({ id: 'doc_111111111111111111111111', name: 'invoice-jan.txt', content: 'january invoice' }),
        makeDocument({ id: 'doc_222222222222222222222222', name: 'invoice-feb.txt', content: 'february invoice' }),
        makeDocument({ id: 'doc_333333333333333333333333', name: 'meeting-notes.txt', content: 'q1 planning' }),
      ];

      const { db } = await createInMemoryDatabase({
        users: [{ id: USER_ID, email: 'user@example.com' }],
        organizations: [{ id: ORGANIZATION_ID, name: 'Org 1' }],
        organizationMembers: [{ organizationId: ORGANIZATION_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
        documents,
      });

      await createDocumentSearchRepository({ db }).indexDocuments({ documents });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({ env: 'test' }),
      }));

      const response = await app.request(
        `/api/organizations/${ORGANIZATION_ID}/documents/batch/trash`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filter: { query: 'invoice' } }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(204);

      const records = await db
        .select(pick(getTableColumns(documentsTable), ['id', 'isDeleted', 'deletedBy']))
        .from(documentsTable)
        .orderBy(documentsTable.id);

      expect(
        records,
      ).to.eql([
        { id: 'doc_111111111111111111111111', isDeleted: true, deletedBy: USER_ID },
        { id: 'doc_222222222222222222222222', isDeleted: true, deletedBy: USER_ID },
        { id: 'doc_333333333333333333333333', isDeleted: false, deletedBy: null },
      ]);
    });
  });
});
