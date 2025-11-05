import type { DatabaseClient } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { map } from 'lodash-es';
import { dbToUserRole } from './roles.models';

export type RolesRepository = ReturnType<typeof createRolesRepository>;

export function createRolesRepository({ db }: { db: DatabaseClient }) {
  return injectArguments(
    {
      getUserRoles,
    },
    { db },
  );
}

async function getUserRoles({ userId, db }: { userId: string; db: DatabaseClient }) {
  const dbRoles = await db
    .selectFrom('user_roles')
    .where('user_id', '=', userId)
    .selectAll()
    .execute();

  const roles = dbRoles.map(dbRole => dbToUserRole(dbRole)).filter((role): role is NonNullable<typeof role> => role !== undefined);

  return {
    roles: map(roles, 'role'),
  };
}
