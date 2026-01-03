import type { Database } from '../app/database/database.types';
import type { Role } from './roles.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq } from 'drizzle-orm';
import { map } from 'lodash-es';
import { userRolesTable } from './roles.table';

export type RolesRepository = ReturnType<typeof createRolesRepository>;

export function createRolesRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getUserRoles,
      assignRoleToUser,
      removeRoleFromUser,
    },
    { db },
  );
}

async function getUserRoles({ userId, db }: { userId: string; db: Database }) {
  const roles = await db
    .select()
    .from(userRolesTable)
    .where(
      eq(userRolesTable.userId, userId),
    );

  return {
    roles: map(roles, 'role'),
  };
}

async function assignRoleToUser({ userId, role, db }: { userId: string; role: Role; db: Database }) {
  await db
    .insert(userRolesTable)
    .values({
      userId,
      role,
    })
    .onConflictDoNothing();
}

async function removeRoleFromUser({ userId, role, db }: { userId: string; role: Role; db: Database }) {
  await db
    .delete(userRolesTable)
    .where(
      and(
        eq(userRolesTable.userId, userId),
        eq(userRolesTable.role, role),
      ),
    );
}
