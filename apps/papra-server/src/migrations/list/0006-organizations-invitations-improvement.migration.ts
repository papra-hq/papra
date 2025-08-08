import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const organizationsInvitationsImprovementMigration = {
  name: 'organizations-invitations-improvement',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "role" TO "role" text NOT NULL`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitations_organization_email_unique" ON "organization_invitations" ("organization_id","email")`),
      db.run(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'pending'`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "role" TO "role" text`),
      db.run(sql`DROP INDEX IF EXISTS "organization_invitations_organization_email_unique"`),
      db.run(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "status" TO "status" text NOT NULL`),
    ]);
  },
} satisfies Migration;
