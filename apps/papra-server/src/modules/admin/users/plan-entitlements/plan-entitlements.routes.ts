import type { RouteDefinitionContext } from '../../../app/server.types';
import * as v from 'valibot';
import { createRoleMiddleware, requireAuthentication } from '../../../app/auth/auth.middleware';
import { PLAN_ENTITLEMENT_SOURCES } from '../../../plan-entitlements/plan-entitlements.constants';
import { createPlanEntitlementsRepository } from '../../../plan-entitlements/plan-entitlements.repository';
import {
  planEntitlementIdSchema,
  planEntitlementTypeSchema,
} from '../../../plan-entitlements/plan-entitlements.schemas';
import { grantUserPlanEntitlement } from '../../../plan-entitlements/plan-entitlements.usecases';
import { PERMISSIONS } from '../../../roles/roles.constants';
import { validateJsonBody, validateParams } from '../../../shared/validation/validation';
import { createUsersRepository } from '../../../users/users.repository';
import { userIdSchema } from '../../../users/users.schemas';

export function registerUserPlanEntitlementsRoutes(context: RouteDefinitionContext) {
  registerGrantPlanEntitlementRoute(context);
  registerRevokePlanEntitlementRoute(context);
}

function registerGrantPlanEntitlementRoute({
  app,
  db,
  planEntitlementDefinitionRegistry,
}: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.post(
    '/api/admin/users/:userId/plan-entitlements',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.MANAGE_PLAN_ENTITLEMENTS],
    }),
    validateParams(
      v.strictObject({
        userId: userIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        type: planEntitlementTypeSchema,
        expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp(), v.toDate()))),
      }),
    ),
    async (context) => {
      const { userId } = context.req.valid('param');
      const { type, expiresAt } = context.req.valid('json');

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      const { planEntitlement } = await grantUserPlanEntitlement({
        userId,
        type,
        expiresAt,
        source: PLAN_ENTITLEMENT_SOURCES.ADMIN,
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      return context.json({ planEntitlement });
    },
  );
}

function registerRevokePlanEntitlementRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.delete(
    '/api/admin/users/:userId/plan-entitlements/:planEntitlementId',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.MANAGE_PLAN_ENTITLEMENTS],
    }),
    validateParams(
      v.strictObject({
        userId: userIdSchema,
        planEntitlementId: planEntitlementIdSchema,
      }),
    ),
    async (context) => {
      const { userId, planEntitlementId } = context.req.valid('param');

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      await planEntitlementsRepository.deleteUserPlanEntitlement({ planEntitlementId, userId });

      return context.body(null, 204);
    },
  );
}
