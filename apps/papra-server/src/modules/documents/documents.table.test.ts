import { sql } from 'kysely';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';

describe('documents table', () => {
  describe('table documents_fts', () => {
    describe('the documents_fts table is synchronized with the documents table using triggers', async () => {
      test('when inserting a document, a corresponding row is inserted in the documents_fts table', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        });

        const now = Date.now();
        await db.insertInto('documents').values([
          {
            id: 'document-1',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Document 1',
            original_name: 'document-1.pdf',
            original_storage_key: 'document-1.pdf',
            original_size: 0,
            content: 'lorem ipsum',
            original_sha256_hash: 'hash1',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
          {
            id: 'document-2',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Photo 1',
            original_name: 'photo-1.jpg',
            original_storage_key: 'photo-1.jpg',
            original_size: 0,
            content: 'dolor sit amet',
            original_sha256_hash: 'hash2',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
        ]).execute();

        const { rows } = await db.executeQuery(sql`SELECT * FROM documents_fts;`.compile(db));

        expect(rows).to.eql([
          {
            id: 'document-1',
            name: 'Document 1',
            content: 'lorem ipsum',
            original_name: 'document-1.pdf',
          },
          {
            id: 'document-2',
            name: 'Photo 1',
            content: 'dolor sit amet',
            original_name: 'photo-1.jpg',
          },
        ]);

        const { rows: searchResults } = await db.executeQuery(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'lorem';`.compile(db));

        expect(searchResults).to.eql([
          {
            id: 'document-1',
            name: 'Document 1',
            content: 'lorem ipsum',
            original_name: 'document-1.pdf',
          },
        ]);
      });

      test('when updating a document, the corresponding row in the documents_fts table is updated', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        });

        const now = Date.now();
        await db.insertInto('documents').values([
          {
            id: 'document-1',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Document 1',
            original_name: 'document-1.pdf',
            original_storage_key: 'document-1.pdf',
            original_size: 0,
            content: 'lorem ipsum',
            original_sha256_hash: 'hash1',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
          {
            id: 'document-2',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Photo 1',
            original_name: 'photo-1.jpg',
            original_storage_key: 'photo-1.jpg',
            original_size: 0,
            content: 'dolor sit amet',
            original_sha256_hash: 'hash2',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
        ]).execute();

        await db.updateTable('documents').set({ content: 'foo bar baz' }).where('id', '=', 'document-1').execute();

        const { rows } = await db.executeQuery(sql`SELECT * FROM documents_fts;`.compile(db));

        expect(rows).to.eql([
          {
            id: 'document-1',
            name: 'Document 1',
            content: 'foo bar baz',
            original_name: 'document-1.pdf',
          },
          {
            id: 'document-2',
            name: 'Photo 1',
            content: 'dolor sit amet',
            original_name: 'photo-1.jpg',
          },
        ]);

        const { rows: searchResults } = await db.executeQuery(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'foo';`.compile(db));

        expect(searchResults).to.eql([
          {
            id: 'document-1',
            name: 'Document 1',
            content: 'foo bar baz',
            original_name: 'document-1.pdf',
          },
        ]);
      });

      test('when deleting a document, the corresponding row in the documents_fts table is deleted', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        });

        const now = Date.now();
        await db.insertInto('documents').values([
          {
            id: 'document-1',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Document 1',
            original_name: 'document-1.pdf',
            original_storage_key: 'document-1.pdf',
            original_size: 0,
            content: 'lorem ipsum',
            original_sha256_hash: 'hash1',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
          {
            id: 'document-2',
            organization_id: 'organization-1',
            created_by: 'user-1',
            mime_type: 'application/pdf',
            name: 'Photo 1',
            original_name: 'photo-1.jpg',
            original_storage_key: 'photo-1.jpg',
            original_size: 0,
            content: 'dolor sit amet',
            original_sha256_hash: 'hash2',
            created_at: now,
            updated_at: now,
            is_deleted: 0,
          },
        ]).execute();

        await db.deleteFrom('documents').where('id', '=', 'document-1').execute();

        const { rows } = await db.executeQuery(sql`SELECT * FROM documents_fts;`.compile(db));

        expect(rows).to.eql([
          {
            id: 'document-2',
            name: 'Photo 1',
            content: 'dolor sit amet',
            original_name: 'photo-1.jpg',
          },
        ]);

        const { rows: searchResults } = await db.executeQuery(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'lorem';`.compile(db));

        expect(searchResults).to.eql([]);
      });
    });
  });
});
