import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const incrementalBackupsMigration = {
  name: 'incremental-backups',

  up: async ({ db }) => {
    // Add a JSON column to store document hashes included in this backup run
    // This enables incremental backups by comparing against previous runs
    await db.run(sql`
      ALTER TABLE "backup_runs" ADD COLUMN "document_sha256_hashes_json" text;
    `);

    // Index for querying runs with document hashes
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "backup_runs_destination_id_status_index" ON "backup_runs" ("destination_id", "status");
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP INDEX IF EXISTS "backup_runs_destination_id_status_index"`);
    await db.run(sql`ALTER TABLE "backup_runs" DROP COLUMN "document_sha256_hashes_json"`);
  },
} satisfies Migration;
