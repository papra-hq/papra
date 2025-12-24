import type { ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Permission, Role } from '../../roles/roles.types';
import type { Database } from '../database/database.types';
import type { Context } from '../server.types';
import { createMiddleware } from 'hono/factory';
import { PERMISSIONS_BY_ROLE } from '../../roles/roles.constants';
import { getPermissionsForRoles } from '../../roles/roles.methods';
import { createRolesRepository } from '../../roles/roles.repository';
import { isNil } from '../../shared/utils';
import { createUnauthorizedError } from './auth.errors';
import { isAuthenticationValid } from './auth.models';

export function requireAuthentication({ apiKeyPermissions }: { apiKeyPermissions?: ApiKeyPermissions[] } = {}) {
  return createMiddleware(async (context: Context, next) => {
    const isAuthenticated = isAuthenticationValid({
      authType: context.get('authType'),
      session: context.get('session'),
      apiKey: context.get('apiKey'),
      requiredApiKeyPermissions: apiKeyPermissions,
    });

    if (!isAuthenticated) {
      throw createUnauthorizedError();
    }

    await next();
  });
}

/**
 * Middleware to require specific permissions for the authenticated user.
 */
export function createRoleMiddleware({ db, permissionsByRole = PERMISSIONS_BY_ROLE }: { db: Database; permissionsByRole?: Record<Role, Readonly<Permission[]>> }) {
  const rolesRepository = createRolesRepository({ db });

  return {
    requirePermissions: ({ requiredPermissions }: { requiredPermissions: Permission[] }) =>
      createMiddleware(async (context: Context, next) => {
        const userId = context.get('userId');

        if (isNil(userId)) {
          throw createUnauthorizedError();
        }

        const { roles } = await rolesRepository.getUserRoles({ userId });

        const { permissions } = getPermissionsForRoles({ roles, permissionsByRole });

        const hasAllPermissions = requiredPermissions.every(permission => permissions.includes(permission));

        if (!hasAllPermissions) {
          throw createUnauthorizedError();
        }

        await next();
      }),
  };
}
