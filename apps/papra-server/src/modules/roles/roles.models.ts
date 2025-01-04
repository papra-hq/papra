import { get, isArray, isString } from 'lodash-es';

export function areSomeRolesInJwtPayload({ roles, jwtPayload }: { roles: string[]; jwtPayload?: Record<string, unknown> }) {
  const rolesInJwt = get(jwtPayload, 'roles');

  if (!rolesInJwt) {
    return false;
  }

  if (!isArray(rolesInJwt) || !rolesInJwt.every(isString)) {
    return false;
  }

  return rolesInJwt.some(role => roles.includes(role));
}
