import { isNil, uniqBy } from '../shared/utils';
import { PLAN_PRIORITY } from './plans.constants';
import type { PlanId } from './plans.constants';
import type { OrganizationPlanRecord } from './plans.types';
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

export function resolveOrganizationPlanFromPriceIds({
  priceIds,
  organizationPlans,
}: {
  priceIds: string[];
  organizationPlans: Record<string, OrganizationPlanRecord>;
}) {
  const plans = Object.values(organizationPlans);
  const matchedPlans: OrganizationPlanRecord[] = [];
  const unknownPriceIds: string[] = [];

  for (const priceId of priceIds) {
    const matchedPlan = plans.find(
      (plan) => plan.monthlyPriceId === priceId || plan.annualPriceId === priceId,
    );

    if (isNil(matchedPlan)) {
      unknownPriceIds.push(priceId);
      continue;
    }

    matchedPlans.push(matchedPlan);
  }

  const [organizationPlan, ...discardedPlans] = uniqBy(matchedPlans, (plan) => plan.id).sort(
    (planA, planB) => getPlanPriority({ planId: planB.id }) - getPlanPriority({ planId: planA.id }),
  );

  return {
    organizationPlan,
    unknownPriceIds,
    discardedPlanIds: discardedPlans.map((plan) => plan.id),
  };
}

function getPlanPriority({ planId }: { planId: string }) {
  return PLAN_PRIORITY[planId as PlanId] ?? 0;
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
