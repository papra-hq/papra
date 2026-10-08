import { defineApiRoute } from '../api/api.routes';
import type { ApiDependencies } from '../app/server.types';
import { getPermissionsForRoles } from '../roles/roles.methods';
import { createRolesRepository } from '../roles/roles.repository';
import { getCurrentUserContract } from './users.api.contracts';
import { createUsersRepository } from './users.repository';

export function buildUserApiRoutes(deps: ApiDependencies) {
  return [setupGetCurrentUserRoute(deps)];
}

function setupGetCurrentUserRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: getCurrentUserContract,
    resolveContext: resolveAuthenticationContext(),
    handler: async ({ context: { userId } }) => {
      const usersRepository = createUsersRepository({ db });
      const rolesRepository = createRolesRepository({ db });

      const [{ user }, { roles }] = await Promise.all([
        usersRepository.getUserByIdOrThrow({ userId }),
        rolesRepository.getUserRoles({ userId }),
      ]);

      const { permissions } = getPermissionsForRoles({ roles });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name ?? '',
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            twoFactorEnabled: user.twoFactorEnabled,
            permissions,
          },
        },
      };
    },
  });
}
