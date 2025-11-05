import type { DatabaseClient } from '../app/database/database.types';
import type { InsertableUser } from './users.tables';
import { injectArguments } from '@corentinth/chisels';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { createUserAlreadyExistsError, createUsersNotFoundError } from './users.errors';
import { dbToUser, userToDb } from './users.models';

export { createUsersRepository };

export type UsersRepository = ReturnType<typeof createUsersRepository>;

function createUsersRepository({ db }: { db: DatabaseClient }) {
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

async function createUser({ user, db, now = new Date() }: { user: InsertableUser; db: DatabaseClient; now?: Date }) {
  try {
    const dbUser = await db
      .insertInto('users')
      .values(userToDb(user, { now }))
      .returningAll()
      .executeTakeFirst();

    return { user: dbToUser(dbUser) };
  } catch (error) {
    if (isUniqueConstraintError({ error })) {
      throw createUserAlreadyExistsError();
    }

    throw error;
  }
}

async function getUserByEmail({ email, db }: { email: string; db: DatabaseClient }) {
  const dbUser = await db
    .selectFrom('users')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();

  return { user: dbToUser(dbUser) };
}

async function getUserById({ userId, db }: { userId: string; db: DatabaseClient }) {
  const dbUser = await db
    .selectFrom('users')
    .where('id', '=', userId)
    .selectAll()
    .executeTakeFirst();

  return { user: dbToUser(dbUser) };
}

async function getUserByIdOrThrow({ userId, db, errorFactory = createUsersNotFoundError }: { userId: string; db: DatabaseClient; errorFactory?: () => Error }) {
  const { user } = await getUserById({ userId, db });

  if (!user) {
    throw errorFactory();
  }

  return { user };
}

async function updateUser({ userId, name, db }: { userId: string; name: string; db: DatabaseClient }) {
  const dbUser = await db
    .updateTable('users')
    .set({ name })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  return { user: dbToUser(dbUser) };
}
