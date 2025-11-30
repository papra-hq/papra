import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const dropFts5TriggersMigration = {
  name: 'drop-fts-5-triggers',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_insert`),
      db.run(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_update`),
      db.run(sql`DROP TRIGGER IF EXISTS trigger_documents_fts_delete`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_insert AFTER INSERT ON documents BEGIN
          INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content);
        END
      `),
      db.run(sql`
        CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_update AFTER UPDATE ON documents BEGIN
          UPDATE documents_fts SET name = new.name, original_name = new.original_name, content = new.content WHERE id = new.id;
        END
      `),
      db.run(sql`
        CREATE TRIGGER IF NOT EXISTS trigger_documents_fts_delete AFTER DELETE ON documents BEGIN
          DELETE FROM documents_fts WHERE id = old.id;
        END
      `),
    ]);
  },
} satisfies Migration;
