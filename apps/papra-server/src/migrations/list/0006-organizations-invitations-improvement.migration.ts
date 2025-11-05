import type { Migration } from '../migrations.types';
import { sql } from 'kysely';

export const organizationsInvitationsImprovementMigration = {
  name: 'organizations-invitations-improvement',

  up: async ({ db }) => {
    await db.executeQuery(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "role" TO "role" text not null`.compile(db));
    await db.executeQuery(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "status" TO "status" text not null DEFAULT 'pending'`.compile(db));

    await db.schema
      .createIndex('organization_invitations_organization_email_unique')
      .unique()
      .ifNotExists()
      .on('organization_invitations')
      .columns(['organization_id', 'email'])
      .execute();
  },

  down: async ({ db }) => {
    await db.executeQuery(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "role" TO "role" text`.compile(db));
    await db.executeQuery(sql`ALTER TABLE "organization_invitations" ALTER COLUMN "status" TO "status" text not null`.compile(db));

    await db.schema
      .dropIndex('organization_invitations_organization_email_unique')
      .ifExists()
      .execute();
  },
} satisfies Migration;
