import { isNil } from '../shared/utils';
import { PLAN_PRIORITY, type PlanId } from './plans.constants';
import { createOrganizationPlanPriceIdNotSetError } from './plans.errors';

export function getPriceIdForBillingInterval({
  plan,
  billingInterval,
}: {
  plan: { monthlyPriceId?: string; annualPriceId?: string };
  billingInterval: 'monthly' | 'annual';
}) {
  const priceId = billingInterval === 'annual' ? plan.annualPriceId : plan.monthlyPriceId;

  if (isNil(priceId)) {
    // Very unlikely to happen, as only the free plan does not have a price ID, and we check for the plans in the route validation
    // but for type safety, we assert that the price ID is set
    throw createOrganizationPlanPriceIdNotSetError();
  }

  return { priceId };
}

export function getApplyablePlanId({
  basePlanId,
  entitlementPlanId,
}: {
  basePlanId: PlanId;
  entitlementPlanId?: PlanId;
}) {
  if (isNil(entitlementPlanId)) {
    return { applyablePlanId: basePlanId };
  }

  const basePlanPriority = PLAN_PRIORITY[basePlanId];
  const entitlementPlanPriority = PLAN_PRIORITY[entitlementPlanId];

  if (entitlementPlanPriority > basePlanPriority) {
    return { applyablePlanId: entitlementPlanId };
  }

  return { applyablePlanId: basePlanId };
}
