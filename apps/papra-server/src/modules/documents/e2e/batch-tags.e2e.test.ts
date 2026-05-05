import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { documentsTagsTable } from '../../tags/tags.table';

const USER_ID = 'usr_111111111111111111111111';
const ORGANIZATION_ID = 'org_222222222222222222222222';
const DOC_1 = 'doc_111111111111111111111111';
const DOC_2 = 'doc_222222222222222222222222';
const TAG_ADD = 'tag_111111111111111111111111';
const TAG_REMOVE = 'tag_222222222222222222222222';

function makeDocument(props: { id: string; name: string }) {
  return {
    ...props,
    organizationId: ORGANIZATION_ID,
    mimeType: 'text/plain',
    originalName: props.name,
    createdBy: USER_ID,
    originalStorageKey: `documents/${props.id}`,
    originalSha256Hash: `hash${props.id}`,
    isDeleted: false,
  };
}

describe('documents e2e', () => {
  describe('batch tags', () => {
    test('adds and removes tags across the targeted documents in a single call', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: USER_ID, email: 'user@example.com' }],
        organizations: [{ id: ORGANIZATION_ID, name: 'Org 1' }],
        organizationMembers: [{ organizationId: ORGANIZATION_ID, userId: USER_ID, role: ORGANIZATION_ROLES.OWNER }],
        documents: [
          makeDocument({ id: DOC_1, name: 'invoice-1.txt' }),
          makeDocument({ id: DOC_2, name: 'invoice-2.txt' }),
        ],
        tags: [
          { id: TAG_ADD, name: 'Reviewed', normalizedName: 'reviewed', color: '#000000', organizationId: ORGANIZATION_ID },
          { id: TAG_REMOVE, name: 'Pending', normalizedName: 'pending', color: '#111111', organizationId: ORGANIZATION_ID },
        ],
      });

      await db.insert(documentsTagsTable).values([{ documentId: DOC_1, tagId: TAG_REMOVE }]);

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({ env: 'test' }),
      }));

      const response = await app.request(
        `/api/organizations/${ORGANIZATION_ID}/documents/batch/tags`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            filter: { documentIds: [DOC_1, DOC_2] },
            addTagIds: [TAG_ADD],
            removeTagIds: [TAG_REMOVE],
          }),
        },
        { loggedInUserId: USER_ID },
      );

      expect(response.status).to.eql(204);

      const pairs = await db
        .select()
        .from(documentsTagsTable)
        .orderBy(documentsTagsTable.documentId, documentsTagsTable.tagId);

      expect(pairs).to.eql([
        { documentId: DOC_1, tagId: TAG_ADD },
        { documentId: DOC_2, tagId: TAG_ADD },
      ]);
    });
  });
});
