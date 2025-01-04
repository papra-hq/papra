import type { Database } from '../app/database/database.types';
import type { DbInsertableOrganization } from './organizations.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { organizationsTable, organizationUsersTable } from './organizations.table';

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>;

export function createOrganizationsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveOrganization,
      getUserOrganizations,
      addUserToOrganization,
      isUserInOrganization,
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
    .leftJoin(organizationUsersTable, eq(organizationsTable.id, organizationUsersTable.organizationId))
    .where(eq(organizationUsersTable.userId, userId));

  return {
    organizations: organizations.map(({ organization }) => organization),
  };
}

async function addUserToOrganization({ userId, organizationId, role, db }: { userId: string; organizationId: string; role: string; db: Database }) {
  await db.insert(organizationUsersTable).values({ userId, organizationId, role });
}

async function isUserInOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: Database }) {
  const organizationUser = await db
    .select()
    .from(organizationUsersTable)
    .where(and(
      eq(organizationUsersTable.userId, userId),
      eq(organizationUsersTable.organizationId, organizationId),
    ));

  return {
    isInOrganization: organizationUser.length > 0,
  };
}
