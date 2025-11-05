import type { DbInsertableUser, DbSelectableUser, InsertableUser, User } from './users.tables';
import { generateId } from '../shared/random/ids';
import { userIdPrefix } from './users.constants';

const generateUserId = () => generateId({ prefix: userIdPrefix });

export function dbToUser(dbUser?: DbSelectableUser): User | undefined {
  if (!dbUser) {
    return undefined;
  }

  return {
    ...dbUser,
    emailVerified: dbUser.email_verified === 1,
    maxOrganizationCount: dbUser.max_organization_count,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  };
}

export function userToDb(
  user: InsertableUser,
  {
    now = new Date(),
    generateId = generateUserId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableUser {
  return {
    ...user,
    id: user.id ?? generateId(),
    email_verified: user.emailVerified === true ? 1 : 0,
    max_organization_count: user.maxOrganizationCount,
    created_at: user.createdAt?.getTime() ?? now.getTime(),
    updated_at: user.updatedAt?.getTime() ?? now.getTime(),
  };
}
