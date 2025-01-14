import type { Database } from '../app/database/database.types';
import type { DbInsertableUser } from './users.types';
import { injectArguments } from '@corentinth/chisels';
import { eq } from 'drizzle-orm';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { createUserAlreadyExistsError, createUsersNotFoundError } from './users.errors';
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
