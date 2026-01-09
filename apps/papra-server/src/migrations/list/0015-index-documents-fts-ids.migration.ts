import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const indexDocumentsFtsIdsMigration = {
  name: 'index-documents-fts-ids',

  up: async ({ db }) => {
    await db.batch([
      // Drop old FTS table
      db.run(sql`DROP TABLE IF EXISTS documents_fts`),

      // Recreate FTS table with document_id and organization_id as indexed for efficient joins and removed original_name
      db.run(sql`CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
        document_id,
        organization_id,
        name,
        content,
        prefix='2 3 4'
      )`),

      // Populate the new FTS table
      db.run(sql`INSERT INTO documents_fts(document_id, organization_id, name, content)
        SELECT id, organization_id, name, content FROM documents`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS documents_fts`),

      // Recreate old FTS table with original schema
      db.run(sql`CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(id UNINDEXED, name, original_name, content, prefix='2 3 4')`),

      // Populate with old structure
      db.run(sql`INSERT INTO documents_fts(id, name, original_name, content) SELECT id, name, original_name, content FROM documents`),
    ]);
  },
} satisfies Migration;
