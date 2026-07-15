import { PLAN_IDS } from '../../plans/plans.constants';
import type { PlanEntitlementDriverFactory } from '../plan-entitlements.types';
import {
  SELFHST_ENTITLEMENT_CLAIM_VALIDITY_DURATION,
  SELFHST_ENTITLEMENT_INELIGIBILITY_GRACE_DURATION,
} from './selfhst.plan-entitlements.constants';
import { verifyEligibilityForSelfhstPlanEntitlements } from './selfhst.plan-entitlements.services';

export const selfhstPlanEntitlementsFactory: PlanEntitlementDriverFactory = ({ config }) => {
  const selfhstConfig = config.planEntitlements.selfhst;
  const { endpoint, token } = selfhstConfig.entitlementVerification;

  return {
    // Without the verification endpoint configured, claims would always be
    // rejected as not-eligible, so report them as disabled instead
    getIsEnabledForNewClaims: async () =>
      selfhstConfig.isEnabledForNewClaims && Boolean(endpoint) && Boolean(token),
    verifyEligibility: async ({ user }) => {
      const { isValid } = await verifyEligibilityForSelfhstPlanEntitlements({
        email: user.email,
        endpointUrl: endpoint,
        token,
      });

      return isValid;
    },
    planId: PLAN_IDS.FREE_EXTENDED,
    subscriptionDiscountCouponId: selfhstConfig.subscriptionDiscountCouponId,
    claimValidityDuration: SELFHST_ENTITLEMENT_CLAIM_VALIDITY_DURATION,
    ineligibilityGraceDuration: SELFHST_ENTITLEMENT_INELIGIBILITY_GRACE_DURATION,
  };
};
