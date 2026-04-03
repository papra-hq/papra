import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const viewsMigration = {
  name: 'views',

  up: async ({ db }) => {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "views" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "name" text NOT NULL,
        "query" text NOT NULL,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
        UNIQUE("organization_id", "name")
      );
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "views"`);
  },
} satisfies Migration;
