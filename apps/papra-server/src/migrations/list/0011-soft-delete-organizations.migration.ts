import type { BatchItem } from 'drizzle-orm/batch';
import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const softDeleteOrganizationsMigration = {
  name: 'soft-delete-organizations',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(organizations)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    const statements = [
      ...(hasColumn('deleted_by') ? [] : [(sql`ALTER TABLE "organizations" ADD "deleted_by" text REFERENCES users(id);`)]),
      ...(hasColumn('deleted_at') ? [] : [(sql`ALTER TABLE "organizations" ADD "deleted_at" integer;`)]),
      ...(hasColumn('scheduled_purge_at') ? [] : [(sql`ALTER TABLE "organizations" ADD "scheduled_purge_at" integer;`)]),

      sql`CREATE INDEX IF NOT EXISTS "organizations_deleted_at_purge_at_index" ON "organizations" ("deleted_at","scheduled_purge_at");`,
      sql`CREATE INDEX IF NOT EXISTS "organizations_deleted_by_deleted_at_index" ON "organizations" ("deleted_by","deleted_at");`,
    ];

    await db.batch(statements.map(statement => db.run(statement) as BatchItem<'sqlite'>) as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP INDEX IF EXISTS "organizations_deleted_at_purge_at_index";`),
      db.run(sql`DROP INDEX IF EXISTS "organizations_deleted_by_deleted_at_index";`),

      db.run(sql`ALTER TABLE "organizations" DROP COLUMN "deleted_by";`),
      db.run(sql`ALTER TABLE "organizations" DROP COLUMN "deleted_at";`),
      db.run(sql`ALTER TABLE "organizations" DROP COLUMN "scheduled_purge_at";`),

    ]);
  },
} satisfies Migration;
