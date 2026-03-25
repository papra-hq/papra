import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

// Migration to fix the notes column from NOT NULL DEFAULT '' to nullable TEXT.
// This can occur when the column was created via drizzle-kit push during development
// before the nullable migration was finalised, leaving it as NOT NULL.
// SQLite does not support ALTER COLUMN, so the table must be recreated.
export const documentsNotesNullableMigration = {
  name: 'documents-notes-nullable',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(documents)`);

    const notesRow = tableInfo.rows.find((row: any) => row.name === 'notes' || row[1] === 'notes');

    if (!notesRow) {
      // Column doesn't exist at all — 0018 will handle adding it
      return;
    }

    const isNotNull = notesRow.notnull === 1 || notesRow[3] === 1;

    if (!isNotNull) {
      // Already nullable, nothing to do
      return;
    }

    // Recreate the table with notes as nullable TEXT
    await db.run(sql`PRAGMA foreign_keys = OFF`);

    await db.run(sql`
      CREATE TABLE documents_new (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "is_deleted" integer DEFAULT false NOT NULL,
        "deleted_at" integer,
        "organization_id" text NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
        "created_by" text REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        "deleted_by" text REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        "original_name" text NOT NULL,
        "original_size" integer DEFAULT 0 NOT NULL,
        "original_storage_key" text NOT NULL,
        "original_sha256_hash" text NOT NULL,
        "name" text NOT NULL,
        "mime_type" text NOT NULL,
        "content" text DEFAULT '' NOT NULL,
        "file_encryption_key_wrapped" text,
        "file_encryption_kek_version" text,
        "file_encryption_algorithm" text,
        "document_date" integer,
        "notes" text
      )
    `);

    // Copy data — convert empty string notes to null since '' meant "no notes"
    await db.run(sql`
      INSERT INTO documents_new
      SELECT
        id, created_at, updated_at, is_deleted, deleted_at,
        organization_id, created_by, deleted_by,
        original_name, original_size, original_storage_key, original_sha256_hash,
        name, mime_type, content,
        file_encryption_key_wrapped, file_encryption_kek_version, file_encryption_algorithm,
        document_date,
        NULLIF(notes, '')
      FROM documents
    `);

    await db.run(sql`DROP TABLE documents`);
    await db.run(sql`ALTER TABLE documents_new RENAME TO documents`);

    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_is_deleted_created_at_index" ON "documents" ("organization_id","is_deleted","created_at")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_is_deleted_index" ON "documents" ("organization_id","is_deleted")`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "documents_organization_id_original_sha256_hash_unique" ON "documents" ("organization_id","original_sha256_hash")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_original_sha256_hash_index" ON "documents" ("original_sha256_hash")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_size_index" ON "documents" ("organization_id","original_size")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_file_encryption_kek_version_index" ON "documents" ("file_encryption_kek_version")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_document_date_index" ON "documents" ("organization_id","document_date")`);

    await db.run(sql`PRAGMA foreign_keys = ON`);
  },

  down: async () => {
    // No rollback — restoring the NOT NULL constraint would be destructive
  },
} satisfies Migration;
