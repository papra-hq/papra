import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const userPlanEntitlementsMigration = {
  name: 'user-plan-entitlements',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`CREATE TABLE IF NOT EXISTS "user_plan_entitlements" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "granted_at" integer NOT NULL,
        "expires_at" integer,
        "last_verified_at" integer,
        "user_id" text NOT NULL,
        "type" text NOT NULL,
        "source" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
      )`),
      db.run(
        sql`CREATE UNIQUE INDEX IF NOT EXISTS "user_plan_entitlements_user_id_type_unique" ON "user_plan_entitlements" ("user_id", "type")`,
      ),
    ]);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "user_plan_entitlements"`);
  },
} satisfies Migration;
