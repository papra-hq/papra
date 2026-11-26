import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const pendingOrganizationInvitationsUniqueMigration = {
  name: 'pending-organization-invitations-unique',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP INDEX IF EXISTS organization_invitations_organization_email_unique`),
      db.run(
        sql`CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_pending_organization_email_unique ON organization_invitations (organization_id, email) WHERE status = 'pending'`,
      ),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      // Rollback discards invitation history to restore the old uniqueness constraint.
      // The pending-only index guarantees the remaining invitations are unique.
      db.run(sql`DELETE FROM organization_invitations WHERE status <> 'pending'`),
      db.run(
        sql`CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitations_organization_email_unique" ON "organization_invitations" ("organization_id","email")`,
      ),
      db.run(sql`DROP INDEX IF EXISTS organization_invitations_pending_organization_email_unique`),
    ]);
  },
} satisfies Migration;
