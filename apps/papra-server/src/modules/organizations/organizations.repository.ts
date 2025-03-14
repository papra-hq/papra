import type { Database } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq } from 'drizzle-orm';
import { organizationMembersTable, organizationsTable } from './organizations.table';

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>;

export function createOrganizationsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      isUserInOrganization,
      getOrganizationById,
    },
    { db },
  );
}

async function isUserInOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: Database }) {
  const organizationUser = await db
    .select()
    .from(organizationMembersTable)
    .where(and(
      eq(organizationMembersTable.userId, userId),
      eq(organizationMembersTable.organizationId, organizationId),
    ));

  return {
    isInOrganization: organizationUser.length > 0,
  };
}

async function getOrganizationById({ organizationId, db }: { organizationId: string; db: Database }) {
  const [organization] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId));

  return {
    organization,
  };
}
