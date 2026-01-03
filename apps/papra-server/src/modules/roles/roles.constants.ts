export const ROLES = {
  ADMIN: 'admin',
} as const;

export const PERMISSIONS = {
  BO_ACCESS: 'bo:access',
  VIEW_USERS: 'users:view',
  VIEW_ANALYTICS: 'analytics:view',
} as const;

export const PERMISSIONS_BY_ROLE = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.BO_ACCESS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
} as const;

export const ROLES_LIST = Object.values(ROLES);
