import type { RouteDefinitionContext } from '../../app/server.types';
import * as v from 'valibot';
import { createRoleMiddleware, requireAuthentication } from '../../app/auth/auth.middleware';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { PERMISSIONS } from '../../roles/roles.constants';
import { createRolesRepository } from '../../roles/roles.repository';
import { createQueryPaginationSchemaKeys } from '../../shared/schemas/pagination.schemas';
import { validateParams, validateQuery } from '../../shared/validation/validation';
import { createUsersRepository } from '../../users/users.repository';
import { userIdSchema } from '../../users/users.schemas';

export function registerUserManagementRoutes(context: RouteDefinitionContext) {
  registerListUsersRoute(context);
  registerGetUserDetailRoute(context);
}

function registerListUsersRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/users',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateQuery(
      v.strictObject({
        search: v.optional(v.string()),
        ...createQueryPaginationSchemaKeys(),
      }),
    ),
    async (context) => {
      const usersRepository = createUsersRepository({ db });

      const { search, pageIndex, pageSize } = context.req.valid('query');

      const { users, totalCount } = await usersRepository.listUsers({
        search,
        pageIndex,
        pageSize,
      });

      return context.json({
        users,
        totalCount,
        pageIndex,
        pageSize,
      });
    },
  );
}

function registerGetUserDetailRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/users/:userId',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(v.strictObject({
      userId: userIdSchema,
    })),
    async (context) => {
      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const rolesRepository = createRolesRepository({ db });

      const { userId } = context.req.valid('param');

      const { user } = await usersRepository.getUserByIdOrThrow({ userId });
      const { organizations } = await organizationsRepository.getUserOrganizations({ userId });
      const { roles } = await rolesRepository.getUserRoles({ userId });

      return context.json({
        user,
        organizations,
        roles,
      });
    },
  );
}
