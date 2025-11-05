import type { DbInsertableUserRole, DbSelectableUserRole, InsertableUserRole, UserRole } from './roles.tables';
import { generateId } from '../shared/random/ids';

const userRoleIdPrefix = 'rol';
const generateUserRoleId = () => generateId({ prefix: userRoleIdPrefix });

export function dbToUserRole(dbUserRole?: DbSelectableUserRole): UserRole | undefined {
  if (!dbUserRole) {
    return undefined;
  }

  return {
    id: dbUserRole.id,
    userId: dbUserRole.user_id,
    role: dbUserRole.role,
    createdAt: new Date(dbUserRole.created_at),
    updatedAt: new Date(dbUserRole.updated_at),
  };
}

export function userRoleToDb(
  userRole: InsertableUserRole,
  {
    now = new Date(),
    generateId = generateUserRoleId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableUserRole {
  return {
    id: userRole.id ?? generateId(),
    user_id: userRole.userId,
    role: userRole.role,
    created_at: userRole.createdAt?.getTime() ?? now.getTime(),
    updated_at: userRole.updatedAt?.getTime() ?? now.getTime(),
  };
}
