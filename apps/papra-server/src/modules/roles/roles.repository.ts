import type { Database } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { eq } from 'drizzle-orm';
import { map } from 'lodash-es';
import { userRolesTable } from './roles.table';

export type RolesRepository = ReturnType<typeof createRolesRepository>;

export function createRolesRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getUserRoles,
    },
    { db },
  );
}

async function getUserRoles({ userId, db }: { userId: string; db: Database }) {
  const roles = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId));

  return {
    roles: map(roles, 'role'),
  };
}
