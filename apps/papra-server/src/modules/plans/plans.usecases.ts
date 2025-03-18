import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { PlansRepository } from './plans.repository';
import { FREE_PLAN_ID } from './plans.constants';

export async function getOrganizationPlan({ organizationId, subscriptionsRepository, plansRepository }: { organizationId: string; subscriptionsRepository: SubscriptionsRepository; plansRepository: PlansRepository }) {
  const { subscription } = await subscriptionsRepository.getOrganizationSubscription({ organizationId });

  const planId = subscription?.planId ?? FREE_PLAN_ID;

  const { organizationPlan } = await plansRepository.getOrganizationPlanById({ planId });

  return { organizationPlan };
}
