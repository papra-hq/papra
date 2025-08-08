import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const apiKeysMigration = {
  name: 'api-keys',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "api_key_organizations" (
          "api_key_id" text NOT NULL,
          "organization_member_id" text NOT NULL,
          FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("organization_member_id") REFERENCES "organization_members"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "api_keys" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "name" text NOT NULL,
          "key_hash" text NOT NULL,
          "prefix" text NOT NULL,
          "user_id" text NOT NULL,
          "last_used_at" integer,
          "expires_at" integer,
          "permissions" text DEFAULT '[]' NOT NULL,
          "all_organizations" integer DEFAULT false NOT NULL,
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_unique" ON "api_keys" ("key_hash")`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "key_hash_index" ON "api_keys" ("key_hash")`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "api_key_organizations"`),
      db.run(sql`DROP TABLE IF EXISTS "api_keys"`),
      db.run(sql`DROP INDEX IF EXISTS "api_keys_key_hash_unique"`),
      db.run(sql`DROP INDEX IF EXISTS "key_hash_index"`),
    ]);
  },
} satisfies Migration;
