import type { Permission, Role } from './roles.types';
import { describe, expect, test } from 'vitest';
import { getPermissionsForRoles } from './roles.methods';

describe('roles methods', () => {
  describe('getPermissionsForRoles', () => {
    const permissionsByRole = {
      admin: ['users:list', 'users:delete', 'bo:access'],
      moderator: ['users:list', 'bo:access', 'tickets:read'],
      support: ['bo:access', 'tickets:read', 'tickets:write'],
    } as Record<Role, Readonly<Permission[]>>;

    test('given a list of user roles, it returns the deduplicated list of permissions for those roles', () => {
      const roles = ['admin', 'moderator'] as Role[];
      const result = getPermissionsForRoles({ roles, permissionsByRole });

      expect(
        result.permissions,
      ).to.eql(
        ['users:list', 'users:delete', 'bo:access', 'tickets:read'],
      );
    });
  });
});
