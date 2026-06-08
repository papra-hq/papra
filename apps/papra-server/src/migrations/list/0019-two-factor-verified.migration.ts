import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const twoFactorVerifiedMigration = {
  name: 'two-factor-verified',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(auth_two_factor)`);
    const existingColumns = tableInfo.rows.map((row) => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('verified')) {
      // Default to true so existing two-factor setups (which were already verified
      // before better-auth introduced this column) keep working after the upgrade.
      await db.run(
        sql`ALTER TABLE "auth_two_factor" ADD COLUMN "verified" integer DEFAULT true NOT NULL;`,
      );
    }
  },

  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE "auth_two_factor" DROP COLUMN "verified";`);
  },
} satisfies Migration;
