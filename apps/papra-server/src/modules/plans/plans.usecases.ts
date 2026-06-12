import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { PlansRepository } from './plans.repository';
import { PLAN_IDS } from './plans.constants';

export async function getOrganizationPlan({
  organizationId,
  subscriptionsRepository,
  plansRepository,
}: {
  organizationId: string;
  subscriptionsRepository: SubscriptionsRepository;
  plansRepository: PlansRepository;
}) {
  const { subscription } = await subscriptionsRepository.getActiveOrganizationSubscription({
    organizationId,
  });

  const planId = subscription?.planId ?? PLAN_IDS.FREE;

  const { organizationPlan } = await plansRepository.getOrganizationPlanById({ planId });

  return { organizationPlan };
}
