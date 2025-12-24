import type { Permission, Role } from './roles.types';
import { uniq } from '../shared/utils';
import { PERMISSIONS_BY_ROLE } from './roles.constants';

export function getPermissionsForRoles({
  roles,
  permissionsByRole = PERMISSIONS_BY_ROLE,
}: {
  roles: Role[];
  permissionsByRole?: Record<Role, Readonly<Permission[]>>;
}): { permissions: Permission[] } {
  return {
    permissions: uniq(roles.flatMap(role => permissionsByRole[role] ?? [])),
  };
}
