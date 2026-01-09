import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../../modules/app/database/database';
import { initialSchemaSetupMigration } from './0001-initial-schema-setup.migration';
import { documentsFtsMigration } from './0002-documents-fts.migration';
import { dropFts5TriggersMigration } from './0013-drop-fts-5-triggers.migration';
import { indexDocumentsFtsIdsMigration } from './0015-index-documents-fts-ids.migration';

describe('0015-index-documents-fts-ids migration', () => {
  describe('index-documents-fts-ids', () => {
    test('the recreation of the FTS table with document_id and organization_id included as searchable columns still permits full text search', async () => {
      const { db } = setupDatabase({ url: ':memory:' });
      // Recreate a documents table and populate it with sample data
      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Test Organization', 0, 0)`),
        db.run(sql`INSERT INTO documents(id, organization_id, original_name, name, mime_type, original_storage_key, original_sha256_hash, content, created_at, updated_at)
          VALUES
          ('doc1', 'org_1', 'Test Document', 'Test Document', 'text/plain', 'key1', 'hash1', 'This is a sample document content about testing.',0,0),
          ('doc2', 'org_1', 'Another Document', 'Another Document', 'text/plain', 'key2', 'hash2', 'This document discusses database migrations.',0,0)
        `),
      ]);

      await documentsFtsMigration.up({ db });
      await dropFts5TriggersMigration.up({ db });

      const { rows: searchBeforeMigration } = await db.run(sql`SELECT id FROM documents_fts WHERE documents_fts = 'Test*'`);

      expect(searchBeforeMigration).to.eql([{ id: 'doc1' }]);

      await indexDocumentsFtsIdsMigration.up({ db });

      const { rows: searchAfterMigration } = await db.run(sql`SELECT document_id FROM documents_fts WHERE documents_fts = 'Test*'`);

      expect(searchAfterMigration).to.eql([{ document_id: 'doc1' }]);
    });
  });
});
