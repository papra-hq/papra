import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const customPropertiesMigration = {
  name: 'custom-properties',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "custom_property_definitions" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "name" text NOT NULL,
          "key" text NOT NULL,
          "description" text,
          "type" text NOT NULL,
          "config" text,
          "display_order" integer NOT NULL DEFAULT 0
        )
      `),

      db.run(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "custom_property_definitions_organization_id_key_unique"
        ON "custom_property_definitions" ("organization_id", "key")
      `),

      db.run(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "custom_property_definitions_organization_id_name_unique"
        ON "custom_property_definitions" ("organization_id", "name")
      `),

      db.run(sql`
        CREATE TABLE IF NOT EXISTS "custom_property_select_options" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "property_definition_id" text NOT NULL REFERENCES "custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "name" text NOT NULL,
          "key" text NOT NULL,
          "display_order" integer NOT NULL DEFAULT 0
        )
      `),

      db.run(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "custom_property_select_options_definition_id_key_unique"
        ON "custom_property_select_options" ("property_definition_id", "key")
      `),

      db.run(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "custom_property_select_options_definition_id_name_unique"
        ON "custom_property_select_options" ("property_definition_id", "name")
      `),

      db.run(sql`
        CREATE TABLE IF NOT EXISTS "document_custom_property_values" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "document_id" text NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "property_definition_id" text NOT NULL REFERENCES "custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "text_value" text,
          "number_value" real,
          "date_value" integer,
          "boolean_value" integer,
          "select_option_id" text REFERENCES "custom_property_select_options"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "user_id" text REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "related_document_id" text REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_document_id_index"
        ON "document_custom_property_values" ("document_id", "property_definition_id")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_text_index"
        ON "document_custom_property_values" ("property_definition_id", "text_value")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_number_index"
        ON "document_custom_property_values" ("property_definition_id", "number_value")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_date_index"
        ON "document_custom_property_values" ("property_definition_id", "date_value")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_boolean_index"
        ON "document_custom_property_values" ("property_definition_id", "boolean_value")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_user_id_index"
        ON "document_custom_property_values" ("property_definition_id", "user_id")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "document_custom_property_values_definition_related_document_id_index"
        ON "document_custom_property_values" ("property_definition_id", "related_document_id")
      `),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "document_custom_property_values"`),
      db.run(sql`DROP TABLE IF EXISTS "custom_property_select_options"`),
      db.run(sql`DROP TABLE IF EXISTS "custom_property_definitions"`),
    ]);
  },
} satisfies Migration;
