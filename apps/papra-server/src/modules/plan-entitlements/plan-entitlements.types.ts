import type { Config } from '../config/config.types';
import type { PlanId } from '../plans/plans.constants';

export type PlanEntitlementDriver = {
  verifyEligibility: (params: { user: { id: string; email: string } }) => Promise<boolean>;
  getIsEnabledForNewClaims: () => Promise<boolean>;
  planId: PlanId;
  claimValidityDuration: Temporal.DurationLike;
  ineligibilityGraceDuration: Temporal.DurationLike;
};

export type PlanEntitlementDriverFactoryParams = {
  config: Config;
};

export type PlanEntitlementDriverFactory = (
  params: PlanEntitlementDriverFactoryParams,
) => PlanEntitlementDriver;
