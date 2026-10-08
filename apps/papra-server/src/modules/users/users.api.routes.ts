import { defineApiRoute } from '../api/api.routes';
import type { ApiDependencies } from '../app/server.types';
import { getPermissionsForRoles } from '../roles/roles.methods';
import { createRolesRepository } from '../roles/roles.repository';
import { getCurrentUserContract, updateCurrentUserContract } from './users.api.contracts';
import { createUsersNotFoundError } from './users.errors';
import { createUsersRepository } from './users.repository';

export function buildUserApiRoutes(deps: ApiDependencies) {
  return [setupGetCurrentUserRoute(deps), setupUpdateCurrentUserRoute(deps)];
}

function setupUpdateCurrentUserRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: updateCurrentUserContract,
    resolveContext: resolveAuthenticationContext(),
    handler: async ({ context: { userId }, body: { name } }) => {
      const usersRepository = createUsersRepository({ db });
      const { user } = await usersRepository.updateUser({ userId, name });

      if (!user) {
        throw createUsersNotFoundError();
      }

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
          },
        },
      };
    },
  });
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
