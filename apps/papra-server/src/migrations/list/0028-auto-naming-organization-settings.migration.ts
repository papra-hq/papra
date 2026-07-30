import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const autoNamingOrganizationSettingsMigration = {
  name: 'auto-naming-organization-settings',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(organization_settings)`);
    const existingColumns = tableInfo.rows.map((row) => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('ai_auto_naming_enabled')) {
      await db.run(sql`ALTER TABLE "organization_settings" ADD COLUMN "ai_auto_naming_enabled" integer`);
    }
    if (!hasColumn('ai_auto_naming_model_id')) {
      await db.run(sql`ALTER TABLE "organization_settings" ADD COLUMN "ai_auto_naming_model_id" text`);
    }
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`ALTER TABLE "organization_settings" DROP COLUMN "ai_auto_naming_enabled"`),
      db.run(sql`ALTER TABLE "organization_settings" DROP COLUMN "ai_auto_naming_model_id"`),
    ]);
  },
} satisfies Migration;
