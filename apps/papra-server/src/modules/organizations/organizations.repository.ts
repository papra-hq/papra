import type { Database } from '../app/database/database.types';
import type { DbInsertableOrganization } from './organizations.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { organizationMembersTable, organizationsTable } from './organizations.table';

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>;

export function createOrganizationsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveOrganization,
      getUserOrganizations,
      addUserToOrganization,
      isUserInOrganization,
      updateOrganization,
      deleteOrganization,
      getOrganizationById,
    },
    { db },
  );
}

async function saveOrganization({ organization: organizationToInsert, db }: { organization: DbInsertableOrganization; db: Database }) {
  const [organization] = await db.insert(organizationsTable).values(organizationToInsert).returning();

  return { organization };
}

async function getUserOrganizations({ userId, db }: { userId: string; db: Database }) {
  const organizations = await db
    .select({
      organization: getTableColumns(organizationsTable),
    })
    .from(organizationsTable)
    .leftJoin(organizationMembersTable, eq(organizationsTable.id, organizationMembersTable.organizationId))
    .where(eq(organizationMembersTable.userId, userId));

  return {
    organizations: organizations.map(({ organization }) => organization),
  };
}

async function addUserToOrganization({ userId, organizationId, role, db }: { userId: string; organizationId: string; role: string; db: Database }) {
  await db.insert(organizationMembersTable).values({ userId, organizationId, role });
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

async function updateOrganization({ organizationId, organization: organizationToUpdate, db }: { organizationId: string; organization: { name: string }; db: Database }) {
  const [organization] = await db
    .update(organizationsTable)
    .set({
      name: organizationToUpdate.name,
    })
    .where(eq(organizationsTable.id, organizationId))
    .returning();

  return { organization };
}

async function deleteOrganization({ organizationId, db }: { organizationId: string; db: Database }) {
  await db.delete(organizationsTable).where(eq(organizationsTable.id, organizationId));
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
