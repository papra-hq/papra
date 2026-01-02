import type { BatchItem } from 'drizzle-orm/batch';
import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const twoFactorAuthenticationMigration = {
  name: 'two-factor-authentication',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(users)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    const statements = [
      sql`
        CREATE TABLE IF NOT EXISTS "auth_two_factor" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "user_id" text,
          "secret" text,
          "backup_codes" text,
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
        );
      `,

      ...(!hasColumn('two_factor_enabled') ? [sql`ALTER TABLE "users" ADD "two_factor_enabled" integer DEFAULT false NOT NULL;`] : []),
    ];

    await db.batch(statements.map(statement => db.run(statement) as BatchItem<'sqlite'>) as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "auth_two_factor";`),
      db.run(sql`ALTER TABLE "users" DROP COLUMN "two_factor_enabled";`),
    ]);
  },
} satisfies Migration;
