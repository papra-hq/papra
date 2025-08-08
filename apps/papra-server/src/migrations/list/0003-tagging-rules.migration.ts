import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const taggingRulesMigration = {
  name: 'tagging-rules',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "tagging_rule_actions" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "tagging_rule_id" text NOT NULL,
          "tag_id" text NOT NULL,
          FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),

      db.run(sql`
        CREATE TABLE IF NOT EXISTS "tagging_rule_conditions" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "tagging_rule_id" text NOT NULL,
          "field" text NOT NULL,
          "operator" text NOT NULL,
          "value" text NOT NULL,
          "is_case_sensitive" integer DEFAULT false NOT NULL,
          FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),

      db.run(sql`
        CREATE TABLE IF NOT EXISTS "tagging_rules" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "organization_id" text NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "enabled" integer DEFAULT true NOT NULL,
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "tagging_rule_actions"`),
      db.run(sql`DROP TABLE IF EXISTS "tagging_rule_conditions"`),
      db.run(sql`DROP TABLE IF EXISTS "tagging_rules"`),
    ]);
  },
} satisfies Migration;
