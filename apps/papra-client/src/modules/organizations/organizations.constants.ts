export const ORGANIZATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const ORGANIZATION_ROLES_LIST = Object.values(ORGANIZATION_ROLES);
