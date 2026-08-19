import type { RouteDefinitionContext } from '../app/server.types';
import { registerAuthenticatedEndpoint } from '../api/contract.registration';
import { getPermissionsForRoles } from '../roles/roles.methods';
import { createRolesRepository } from '../roles/roles.repository';
import { createUsersRepository } from './users.repository';
import {
  getCurrentUserEndpointContract,
  updateCurrentUserEndpointContract,
} from './users.routes.contract';

export function registerUsersRoutes(context: RouteDefinitionContext) {
  setupGetCurrentUserRoute(context);
  setupUpdateUserRoute(context);
}

function setupGetCurrentUserRoute({ app, db }: RouteDefinitionContext) {
  registerAuthenticatedEndpoint({
    app,
    contract: getCurrentUserEndpointContract,
    handler: async ({ userId }) => {
      const usersRepository = createUsersRepository({ db });
      const rolesRepository = createRolesRepository({ db });

      const [{ user }, { roles }] = await Promise.all([
        usersRepository.getUserByIdOrThrow({ userId }),
        rolesRepository.getUserRoles({ userId }),
      ]);

      const { permissions } = getPermissionsForRoles({ roles });

      return {
        status: 200,
        body: { user: { ...user, permissions } },
      };
    },
  });
}

function setupUpdateUserRoute({ app, db }: RouteDefinitionContext) {
  registerAuthenticatedEndpoint({
    app,
    contract: updateCurrentUserEndpointContract,
    handler: async ({ userId, body }) => {
      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.updateUser({ userId, name: body.name });

      return {
        status: 200,
        body: { user },
      };
    },
  });
}
