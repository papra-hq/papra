export const ROLES = {
  ADMIN: 'admin',
} as const;

export const PERMISSIONS = {
  BO_ACCESS: 'bo:access',
  VIEW_USERS: 'users:view',
  DELETE_USERS: 'users:delete',
  DELETE_ORGANIZATIONS: 'organizations:delete',
  VIEW_ANALYTICS: 'analytics:view',
  MANAGE_PLAN_ENTITLEMENTS: 'plan-entitlements:manage',
} as const;

export const PERMISSIONS_BY_ROLE = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.DELETE_ORGANIZATIONS,
    PERMISSIONS.BO_ACCESS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_PLAN_ENTITLEMENTS,
  ],
} as const;

export const ROLES_LIST = Object.values(ROLES);
