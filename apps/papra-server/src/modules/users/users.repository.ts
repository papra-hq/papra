import type { Database } from '../app/database/database.types';
import type { DbInsertableUser } from './users.types';
import { injectArguments } from '@corentinth/chisels';
import { count, desc, eq, getTableColumns } from 'drizzle-orm';
import { organizationMembersTable } from '../organizations/organizations.table';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { withPagination } from '../shared/db/pagination';
import { createUserAlreadyExistsError, createUsersNotFoundError } from './users.errors';
import { createSearchUserWhereClause } from './users.repository.models';
import { usersTable } from './users.table';

export { createUsersRepository };

export type UsersRepository = ReturnType<typeof createUsersRepository>;

function createUsersRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createUser,
      getUserByEmail,
      getUserById,
      getUserByIdOrThrow,
      updateUser,
      getUserCount,
      listUsers,
    },
    { db },
  );
}

async function createUser({ user: userToCreate, db }: { user: DbInsertableUser; db: Database }) {
  try {
    const [user] = await db.insert(usersTable).values(userToCreate).returning();

    return { user };
  } catch (error) {
    if (isUniqueConstraintError({ error })) {
      throw createUserAlreadyExistsError();
    }

    throw error;
  }
}

async function getUserByEmail({ email, db }: { email: string; db: Database }) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    return { user: undefined };
  }

  return { user };
}

async function getUserById({ userId, db }: { userId: string; db: Database }) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    return { user: undefined };
  }

  return { user };
}

async function getUserByIdOrThrow({ userId, db, errorFactory = createUsersNotFoundError }: { userId: string; db: Database; errorFactory?: () => Error }) {
  const { user } = await getUserById({ userId, db });

  if (!user) {
    throw errorFactory();
  }

  return { user };
}

async function updateUser({ userId, name, db }: { userId: string; name: string; db: Database }) {
  const [user] = await db.update(usersTable).set({ name }).where(eq(usersTable.id, userId)).returning();

  return { user };
}

export async function getUserCount({ db }: { db: Database }) {
  const [{ userCount = 0 } = {}] = await db.select({ userCount: count() }).from(usersTable);

  return {
    userCount,
  };
}

async function listUsers({
  db,
  search,
  pageIndex = 0,
  pageSize = 25,
}: {
  db: Database;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}) {
  const searchWhereClause = createSearchUserWhereClause({ search });

  const query = db
    .select({
      ...getTableColumns(usersTable),
      organizationCount: count(organizationMembersTable.id),
    })
    .from(usersTable)
    .leftJoin(
      organizationMembersTable,
      eq(usersTable.id, organizationMembersTable.userId),
    )
    .where(searchWhereClause)
    .groupBy(usersTable.id)
    .$dynamic();

  const users = await withPagination(query, {
    orderByColumn: desc(usersTable.createdAt),
    pageIndex,
    pageSize,
  });

  const [{ totalCount = 0 } = {}] = await db
    .select({ totalCount: count() })
    .from(usersTable)
    .where(searchWhereClause);

  return {
    users,
    totalCount,
    pageIndex,
    pageSize,
  };
}
