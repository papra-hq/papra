import { eq, sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLE_MEMBER } from '../organizations/organizations.constants';
import { documentsTable } from './documents.table';

describe('documents table', () => {
  describe('table documents_fts', () => {
    describe('the documents_fts table is synchronized with the documents table using triggers', async () => {
      test('when inserting a document, a corresponding row is inserted in the documents_fts table', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
        });

        await db.insert(documentsTable).values([
          {
            id: 'document-1',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Document 1',
            originalName: 'document-1.pdf',
            originalStorageKey: 'document-1.pdf',
            content: 'lorem ipsum',
            originalSha256Hash: 'hash1',
          },
          {
            id: 'document-2',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Photo 1',
            originalName: 'photo-1.jpg',
            originalStorageKey: 'photo-1.jpg',
            content: 'dolor sit amet',
            originalSha256Hash: 'hash2',
          },
        ]);

        const { rows } = await db.run(sql`SELECT * FROM documents_fts;`);

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

        const { rows: searchResults } = await db.run(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'lorem';`);

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
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
        });

        await db.insert(documentsTable).values([
          {
            id: 'document-1',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Document 1',
            originalName: 'document-1.pdf',
            originalStorageKey: 'document-1.pdf',
            content: 'lorem ipsum',
            originalSha256Hash: 'hash1',
          },
          {
            id: 'document-2',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Photo 1',
            originalName: 'photo-1.jpg',
            originalStorageKey: 'photo-1.jpg',
            content: 'dolor sit amet',
            originalSha256Hash: 'hash2',
          },
        ]);

        await db.update(documentsTable).set({ content: 'foo bar baz' }).where(eq(documentsTable.id, 'document-1'));

        const { rows } = await db.run(sql`SELECT * FROM documents_fts;`);

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

        const { rows: searchResults } = await db.run(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'foo';`);

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
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
        });

        await db.insert(documentsTable).values([
          {
            id: 'document-1',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Document 1',
            originalName: 'document-1.pdf',
            originalStorageKey: 'document-1.pdf',
            content: 'lorem ipsum',
            originalSha256Hash: 'hash1',
          },
          {
            id: 'document-2',
            organizationId: 'organization-1',
            createdBy: 'user-1',
            mimeType: 'application/pdf',
            name: 'Photo 1',
            originalName: 'photo-1.jpg',
            originalStorageKey: 'photo-1.jpg',
            content: 'dolor sit amet',
            originalSha256Hash: 'hash2',
          },
        ]);

        await db.delete(documentsTable).where(eq(documentsTable.id, 'document-1'));

        const { rows } = await db.run(sql`SELECT * FROM documents_fts;`);

        expect(rows).to.eql([
          {
            id: 'document-2',
            name: 'Photo 1',
            content: 'dolor sit amet',
            original_name: 'photo-1.jpg',
          },
        ]);

        const { rows: searchResults } = await db.run(sql`SELECT * FROM documents_fts WHERE documents_fts MATCH 'lorem';`);

        expect(searchResults).to.eql([]);
      });
    });
  });
});
