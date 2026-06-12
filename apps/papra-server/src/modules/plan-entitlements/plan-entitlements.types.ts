import type { Config } from '../config/config.types';
import type { PlanId } from '../plans/plans.constants';

export type PlanEntitlementDriver = {
  verifyEligibility: (params: { userId: string }) => Promise<boolean>;
  getIsEnabledForNewClaims: () => Promise<boolean>;
  planId: PlanId;
};

export type PlanEntitlementDriverFactoryParams = {
  config: Config;
};

export type PlanEntitlementDriverFactory = (
  params: PlanEntitlementDriverFactoryParams,
) => PlanEntitlementDriver;
