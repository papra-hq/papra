import type { Database } from '../../database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, gt, lt } from 'drizzle-orm';
import { size } from 'lodash-es';
import { authTokensTable } from './auth-tokens.table';

export type AuthTokensRepository = ReturnType<typeof createAuthTokensRepository>;

export function createAuthTokensRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveAuthToken,
      getAuthTokenValidity,
      deleteAuthToken,
      deleteExpiredAuthTokens,
    },
    { db },
  );
}

async function saveAuthToken({ db, userId, token, expiresAt }: { db: Database; userId: string; token: string; expiresAt: Date }) {
  const [authTokenDetails] = await db.insert(authTokensTable).values({ userId, token, expiresAt }).returning();

  return { authTokenDetails };
}

async function getAuthTokenValidity({ db, token, userId, now = new Date() }: { db: Database; token: string; userId: string; now?: Date }) {
  const [authTokenDetails] = await db
    .select()
    .from(authTokensTable)
    .where(and(eq(authTokensTable.token, token), eq(authTokensTable.userId, userId), gt(authTokensTable.expiresAt, now)));

  return { isValid: Boolean(authTokenDetails) };
}

async function deleteAuthToken({ db, token }: { db: Database; token: string }) {
  await db.delete(authTokensTable).where(eq(authTokensTable.token, token));
}

async function deleteExpiredAuthTokens({ db, now = new Date() }: { db: Database; now?: Date }) {
  const deletedRecords = await db.delete(authTokensTable).where(lt(authTokensTable.expiresAt, now)).returning({ id: authTokensTable.id });

  return { deletedCount: size(deletedRecords) };
}
