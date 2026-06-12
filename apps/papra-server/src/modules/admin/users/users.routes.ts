import type { RouteDefinitionContext } from '../../app/server.types';
import * as v from 'valibot';
import { createRoleMiddleware, requireAuthentication } from '../../app/auth/auth.middleware';
import { getUser } from '../../app/auth/auth.models';
import { getUserMaxOrganizationCount } from '../../organizations/organizations.models';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { planEntitlementsDefinitionFactories } from '../../plan-entitlements/plan-entitlements.registry';
import { createPlanEntitlementsRepository } from '../../plan-entitlements/plan-entitlements.repository';
import { PERMISSIONS } from '../../roles/roles.constants';
import { createRolesRepository } from '../../roles/roles.repository';
import { createQueryPaginationSchemaKeys } from '../../shared/schemas/pagination.schemas';
import { validateParams, validateQuery } from '../../shared/validation/validation';
import { createCannotDeleteSelfError } from '../../users/users.errors';
import { createUsersRepository } from '../../users/users.repository';
import { userIdSchema } from '../../users/users.schemas';
import { deleteUser } from '../../users/users.usecases';
import { registerUserPlanEntitlementsRoutes } from './plan-entitlements/plan-entitlements.routes';

export function registerUserManagementRoutes(context: RouteDefinitionContext) {
  registerListUsersRoute(context);
  registerGetUserDetailRoute(context);
  registerDeleteUserRoute(context);
  registerUserPlanEntitlementsRoutes(context);
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

function registerGetUserDetailRoute({ app, db, config }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/users/:userId',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(
      v.strictObject({
        userId: userIdSchema,
      }),
    ),
    async (context) => {
      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const rolesRepository = createRolesRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      const { userId } = context.req.valid('param');

      const [{ user }, { organizations }, { roles }, { planEntitlements }] = await Promise.all([
        usersRepository.getUserByIdOrThrow({ userId }),
        organizationsRepository.getUserOrganizations({ userId }),
        rolesRepository.getUserRoles({ userId }),
        planEntitlementsRepository.getUserPlanEntitlements({ userId }),
      ]);

      return context.json({
        user: {
          ...user,
          maxOrganizationCount: getUserMaxOrganizationCount({ user, config }),
        },
        organizations,
        roles,
        planEntitlements,
        availablePlanEntitlementTypes: Object.keys(planEntitlementsDefinitionFactories),
      });
    },
  );
}

function registerDeleteUserRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.delete(
    '/api/admin/users/:userId',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.DELETE_USERS],
    }),
    validateParams(
      v.strictObject({
        userId: userIdSchema,
      }),
    ),
    async (context) => {
      const { userId: actingUserId } = getUser({ context });
      const { userId } = context.req.valid('param');

      if (userId === actingUserId) {
        throw createCannotDeleteSelfError();
      }

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await deleteUser({ userId, usersRepository, organizationsRepository });

      return context.body(null, 204);
    },
  );
}
