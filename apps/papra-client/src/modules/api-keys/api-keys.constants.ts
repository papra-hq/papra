// export const API_KEY_PERMISSIONS = {
//   documents: {
//     create: 'documents:create',
//   },
// } as const;

export const API_KEY_PERMISSIONS = [
  {
    section: 'organizations',
    permissions: [
      'organizations:create',
      'organizations:read',
      'organizations:update',
      'organizations:delete',
    ],
  },
  {
    section: 'documents',
    permissions: [
      'documents:create',
      'documents:read',
      'documents:update',
      'documents:delete',
    ],
  },
  {
    section: 'tags',
    permissions: [
      'tags:create',
      'tags:read',
      'tags:update',
      'tags:delete',
    ],
  },
  {
    section: 'custom-properties',
    permissions: [
      'custom-properties:create',
      'custom-properties:read',
      'custom-properties:update',
      'custom-properties:delete',
    ],
  },
] as const;

export const API_KEY_PERMISSIONS_LIST = API_KEY_PERMISSIONS.flatMap(permission => permission.permissions);
