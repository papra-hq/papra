import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { scopeKvStoreForRateLimit } from '../app/rate-limit/rate-limit.kv-store';
import { checkRateLimit } from '../app/rate-limit/rate-limit.usecases';
import { joinKeyParts } from '../kv-store/kv-store.models';
import { validateParams } from '../shared/validation/validation';
import { createUsersRepository } from '../users/users.repository';
import { createPlanEntitlementsRepository } from './plan-entitlements.repository';
import { planEntitlementTypeSchema } from './plan-entitlements.schemas';
import { claimUserPlanEntitlement } from './plan-entitlements.usecases';

export function registerPlanEntitlementsRoutes(context: RouteDefinitionContext) {
  setupGetUserPlanEntitlementsRoute(context);
  setupClaimPlanEntitlementRoute(context);
}

function setupGetUserPlanEntitlementsRoute({ app, db }: RouteDefinitionContext) {
  app.get('/api/plan-entitlements', requireAuthentication(), async (context) => {
    const { userId } = getUser({ context });

    const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

    const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
      userId,
    });

    return context.json({ planEntitlements });
  });
}

function setupClaimPlanEntitlementRoute({
  app,
  db,
  config,
  kvStore,
  planEntitlementDefinitionRegistry,
}: RouteDefinitionContext) {
  app.post(
    '/api/plan-entitlements/:type/claim',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        type: planEntitlementTypeSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { type } = context.req.valid('param');

      await checkRateLimit({
        ...config.planEntitlements.claimRateLimit,
        key: joinKeyParts(['plan-entitlements-claim', userId]),
        kvStore: scopeKvStoreForRateLimit({ kvStore }),
      });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      const { planEntitlement } = await claimUserPlanEntitlement({
        userId,
        type,
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      return context.json({ planEntitlement });
    },
  );
}
