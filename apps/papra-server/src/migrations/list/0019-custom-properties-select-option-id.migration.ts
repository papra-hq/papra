import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const customPropertiesSelectOptionIdMigration = {
  name: 'custom-properties-select-option-id',
  description: 'Add select_option_id FK column to document_custom_property_values for referential integrity with select options',

  up: async ({ db }) => {
    await db.run(sql`
      ALTER TABLE "document_custom_property_values"
      ADD COLUMN "select_option_id" text REFERENCES "custom_property_select_options"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "document_custom_property_values_select_option_id_index"
      ON "document_custom_property_values" ("select_option_id")
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP INDEX IF EXISTS "document_custom_property_values_select_option_id_index"`);
    // SQLite does not support DROP COLUMN in older versions, but modern SQLite (3.35+) does
    await db.run(sql`ALTER TABLE "document_custom_property_values" DROP COLUMN "select_option_id"`);
  },
} satisfies Migration;
