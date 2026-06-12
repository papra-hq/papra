import { PLAN_IDS } from '../plans/plans.constants';
import type { PlanEntitlementDefinitionRegistry } from './plan-entitlements.registry';
import type { PlanEntitlementDriver } from './plan-entitlements.types';

export function createTestPlanEntitlementDriver(
  overrides: Partial<PlanEntitlementDriver> = {},
): PlanEntitlementDriver {
  return {
    planId: PLAN_IDS.FREE_EXTENDED,
    verifyEligibility: async () => true,
    getIsEnabledForNewClaims: async () => true,
    ...overrides,
  };
}

export function createTestPlanEntitlementRegistry({
  driver = createTestPlanEntitlementDriver(),
}: { driver?: PlanEntitlementDriver } = {}): PlanEntitlementDefinitionRegistry {
  return {
    getPlanEntitlementDriver: () => ({ planEntitlementDriver: driver }),
  };
}

export function createEmptyTestPlanEntitlementRegistry(): PlanEntitlementDefinitionRegistry {
  return {
    getPlanEntitlementDriver: () => ({ planEntitlementDriver: undefined }),
  };
}
