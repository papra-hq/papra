import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const addOrganizationSettingsTableMigration = {
  name: 'add-organization-settings-table',

  up: async ({ db }) => {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "organization_settings" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "ai_auto_tagging_enabled" integer,
        "ai_auto_tagging_can_create_new_tags" integer,
        "ai_auto_tagging_max_tags" integer,
        "ai_auto_tagging_model_id" text,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
        UNIQUE("organization_id")
      );
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "organization_settings"`);
  },
} satisfies Migration;
