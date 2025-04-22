// export const API_KEY_PERMISSIONS = {
//   documents: {
//     create: 'documents:create',
//   },
// } as const;

export const API_KEY_PERMISSIONS = [
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
] as const;

export const API_KEY_PERMISSIONS_LIST = API_KEY_PERMISSIONS.flatMap(permission => permission.permissions);
