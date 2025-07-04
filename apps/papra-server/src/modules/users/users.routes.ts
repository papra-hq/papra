import type { RouteDefinitionContext } from '../app/server.types';
import { pick } from 'lodash-es';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createRolesRepository } from '../roles/roles.repository';
import { validateJsonBody } from '../shared/validation/validation';
import { createUsersRepository } from './users.repository';

export function registerUsersRoutes(context: RouteDefinitionContext) {
  setupGetCurrentUserRoute(context);
  setupUpdateUserRoute(context);
}

function setupGetCurrentUserRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/users/me',
    requireAuthentication(),
    async (context) => {
      const { userId } = getUser({ context });

      const usersRepository = createUsersRepository({ db });
      const rolesRepository = createRolesRepository({ db });

      const [
        { user },
        { roles },
      ] = await Promise.all([
        usersRepository.getUserByIdOrThrow({ userId }),
        rolesRepository.getUserRoles({ userId }),
      ]);

      return context.json({
        user: {
          roles,
          ...pick(
            user,
            [
              'id',
              'email',
              'name',
              'createdAt',
              'updatedAt',
              'planId',
            ],
          ),
        },
      });
    },
  );
}

function setupUpdateUserRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/users/me',
    requireAuthentication(),
    validateJsonBody(z.object({
      name: z.string().min(1).max(50),
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { name } = context.req.valid('json');

      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.updateUser({ userId, name });

      return context.json({ user });
    },
  );
}
