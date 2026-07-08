import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const foldersMigration = {
  name: 'folders',

  up: async ({ db }) => {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "folders" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "parent_id" text,
        "name" text NOT NULL,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON UPDATE cascade ON DELETE cascade
      );
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "folders_organization_id_idx" ON "folders" ("organization_id");
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "folders_parent_id_idx" ON "folders" ("parent_id");
    `);

    // SQLite's ALTER TABLE ADD COLUMN has no IF NOT EXISTS form, so guard
    // manually — this migration must be safe to replay (e.g. after the
    // migrations tracking table is dropped and all migrations rerun).
    const existingColumns = await getRuntimeTableColumns({ tableName: 'documents', db });

    if (!existingColumns.includes('folder_id')) {
      await db.run(sql`
        ALTER TABLE "documents" ADD COLUMN "folder_id" text REFERENCES "folders"("id") ON UPDATE cascade ON DELETE set null;
      `);
    }

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "documents_folder_id_idx" ON "documents" ("folder_id");
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP INDEX IF EXISTS "documents_folder_id_idx"`);
    await db.run(sql`ALTER TABLE "documents" DROP COLUMN "folder_id"`);
    await db.run(sql`DROP TABLE IF EXISTS "folders"`);
  },
} satisfies Migration;
