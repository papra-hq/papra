import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const kvStoreMigration = {
  name: 'kv-store',

  up: async ({ db }) => {
    await db.run(sql`CREATE TABLE IF NOT EXISTS "kv_store" (
      "key" text PRIMARY KEY NOT NULL,
      "value" text NOT NULL,
      "expires_at" integer
    )`);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "kv_store"`);
  },
} satisfies Migration;
