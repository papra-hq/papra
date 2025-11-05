import type { Migration } from '../migrations.types';
import { sql } from 'kysely';

export const documentsFtsMigration = {
  name: 'documents-fts',

  up: async ({ db }) => {
    // FTS5 virtual tables and triggers require raw SQL (SQLite-specific)
    await db.executeQuery(sql`CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(id UNINDEXED, name, original_name, content, prefix='2 3 4')`.compile(db));
    await db.executeQuery(sql`INSERT INTO documents_fts(id, name, original_name, content) SELECT id, name, original_name, content FROM documents`.compile(db));

    await db.executeQuery(sql`
      CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_insert AFTER INSERT ON documents BEGIN
        INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content);
      END
    `.compile(db));

    await db.executeQuery(sql`
      CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_update AFTER UPDATE ON documents BEGIN
        UPDATE documents_fts SET name = new.name, original_name = new.original_name, content = new.content WHERE id = new.id;
      END
    `.compile(db));

    await db.executeQuery(sql`
      CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_delete AFTER DELETE ON documents BEGIN
        DELETE FROM documents_fts WHERE id = old.id;
      END
    `.compile(db));
  },

  down: async ({ db }) => {
    await db.executeQuery(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_insert`.compile(db));
    await db.executeQuery(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_update`.compile(db));
    await db.executeQuery(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_delete`.compile(db));
    await db.executeQuery(sql`DROP TABLE IF EXISTS documents_fts`.compile(db));
  },
} satisfies Migration;
