import { PLAN_IDS } from '../../plans/plans.constants';
import type { PlanEntitlementDriverFactory } from '../plan-entitlements.types';

export const selfhstPlanEntitlementsFactory: PlanEntitlementDriverFactory = ({ config }) => {
  const selfhstConfig = config.planEntitlements.selfhst;

  return {
    getIsEnabledForNewClaims: async () => selfhstConfig.isEnabledForNewClaims,
    verifyEligibility: async () => false, // Temporary, waiting for implementation
    planId: PLAN_IDS.FREE_EXTENDED,
  };
};
