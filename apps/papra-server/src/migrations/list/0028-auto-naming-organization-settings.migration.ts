import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const autoNamingOrganizationSettingsMigration = {
  name: 'auto-naming-organization-settings',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`ALTER TABLE "organization_settings" ADD COLUMN "ai_auto_naming_enabled" integer`),
      db.run(sql`ALTER TABLE "organization_settings" ADD COLUMN "ai_auto_naming_model_id" text`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`ALTER TABLE "organization_settings" DROP COLUMN "ai_auto_naming_enabled"`),
      db.run(sql`ALTER TABLE "organization_settings" DROP COLUMN "ai_auto_naming_model_id"`),
    ]);
  },
} satisfies Migration;
