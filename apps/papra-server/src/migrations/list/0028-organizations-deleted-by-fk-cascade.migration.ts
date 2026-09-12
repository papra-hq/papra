import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

// The organizations.deleted_by column was added in the soft-delete-organizations
// migration via a plain `ALTER TABLE ... ADD COLUMN`, which cannot carry a
// foreign key `ON UPDATE` / `ON DELETE` clause. The schema (organizations.table.ts)
// has always declared `{ onDelete: 'set null', onUpdate: 'cascade' }` for this
// column, but the database never enforced it (defaulting to `no action` on both).
// SQLite has no `ALTER TABLE ... ALTER COLUMN`, so fixing this requires the
// standard rebuild-and-swap procedure (same approach as the
// document-activity-log-on-delete-set-null migration).
export const organizationsDeletedByFkCascadeMigration = {
  name: 'organizations-deleted-by-fk-cascade',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`PRAGMA foreign_keys=OFF`),
      db.run(sql`
        CREATE TABLE "__new_organizations" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "name" text NOT NULL,
          "customer_id" text,
          "deleted_by" text,
          "deleted_at" integer,
          "scheduled_purge_at" integer,
          FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null
        );
      `),
      db.run(sql`
        INSERT INTO "__new_organizations"("id", "created_at", "updated_at", "name", "customer_id", "deleted_by", "deleted_at", "scheduled_purge_at") SELECT "id", "created_at", "updated_at", "name", "customer_id", "deleted_by", "deleted_at", "scheduled_purge_at" FROM "organizations";
      `),
      db.run(sql`DROP TABLE IF EXISTS "organizations"`),
      db.run(sql`ALTER TABLE "__new_organizations" RENAME TO "organizations"`),
      // The table rebuild drops the indexes that lived on the old table, so
      // they need to be recreated here.
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_deleted_by_deleted_at_index" ON "organizations" ("deleted_by","deleted_at");`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_scheduled_purge_at_index" ON "organizations" ("scheduled_purge_at") WHERE "deleted_at" IS NOT NULL;`,
      ),
      db.run(sql`PRAGMA foreign_keys=ON`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`PRAGMA foreign_keys=OFF`),
      db.run(sql`
        CREATE TABLE "__restore_organizations" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "name" text NOT NULL,
          "customer_id" text ,
          "deleted_by" text REFERENCES users(id),
          "deleted_at" integer,
          "scheduled_purge_at" integer);
      `),
      db.run(
        sql`INSERT INTO "__restore_organizations"("id", "created_at", "updated_at", "name", "customer_id", "deleted_by", "deleted_at", "scheduled_purge_at") SELECT "id", "created_at", "updated_at", "name", "customer_id", "deleted_by", "deleted_at", "scheduled_purge_at" FROM "organizations";`,
      ),
      db.run(sql`DROP TABLE IF EXISTS "organizations"`),
      db.run(sql`ALTER TABLE "__restore_organizations" RENAME TO "organizations"`),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_deleted_by_deleted_at_index" ON "organizations" ("deleted_by","deleted_at");`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_scheduled_purge_at_index" ON "organizations" ("scheduled_purge_at") WHERE "deleted_at" IS NOT NULL;`,
      ),
      db.run(sql`PRAGMA foreign_keys=ON`),
    ]);
  },
} satisfies Migration;
