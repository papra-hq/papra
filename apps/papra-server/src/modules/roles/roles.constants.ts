export const PERMISSIONS = {
  BO_ACCESS: 'bo:access',
  VIEW_USERS: 'users:view',
  VIEW_ANALYTICS: 'analytics:view',
} as const;

export const PERMISSIONS_BY_ROLE = {
  admin: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.BO_ACCESS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
} as const;

export const ROLES = Object.keys(PERMISSIONS_BY_ROLE) as (keyof typeof PERMISSIONS_BY_ROLE)[];
