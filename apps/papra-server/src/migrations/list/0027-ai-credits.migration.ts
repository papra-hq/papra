import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const aiCreditsMigration = {
  name: 'ai-credits',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`CREATE TABLE IF NOT EXISTS "organization_ai_credits_usage" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "credits_consumed" integer NOT NULL,
        "usage" text NOT NULL,
        "source" text NOT NULL,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
      )`),

      // Current period credits count: sum where organization_id = ? and created_at >= ?
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organization_ai_credits_usage_organization_id_created_at_index" ON "organization_ai_credits_usage" ("organization_id", "created_at")`,
      ),

      // Cascade index
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organization_ai_credits_usage_organization_id_index" ON "organization_ai_credits_usage" ("organization_id")`,
      ),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([db.run(sql`DROP TABLE IF EXISTS "organization_ai_credits_usage"`)]);
  },
} satisfies Migration;
