import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { PlansRepository } from './plans.repository';
import type { PlanId } from './plans.constants';
import { PLAN_IDS } from './plans.constants';
import { resolveOrganizationPlanEntitlements } from '../plan-entitlements/plan-entitlements.usecases';
import { getApplyablePlanId } from './plans.models';
import type { PlanEntitlementsRepository } from '../plan-entitlements/plan-entitlements.repository';
import type { PlanEntitlementDefinitionRegistry } from '../plan-entitlements/plan-entitlements.registry';

export async function getOrganizationPlan({
  organizationId,
  subscriptionsRepository,
  plansRepository,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
}: {
  organizationId: string;
  subscriptionsRepository: SubscriptionsRepository;
  plansRepository: PlansRepository;
  planEntitlementsRepository: PlanEntitlementsRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
}) {
  const [{ subscription }, { planId: entitlementPlanId }] = await Promise.all([
    subscriptionsRepository.getActiveOrganizationSubscription({
      organizationId,
    }),
    resolveOrganizationPlanEntitlements({
      organizationId,
      planEntitlementsRepository,
      planEntitlementDefinitionRegistry,
    }),
  ]);

  const basePlanId = (subscription?.planId ?? PLAN_IDS.FREE) as PlanId;

  const { applyablePlanId } = getApplyablePlanId({
    basePlanId,
    entitlementPlanId,
  });

  const { organizationPlan } = await plansRepository.getOrganizationPlanById({
    planId: applyablePlanId,
  });

  return { organizationPlan };
}
