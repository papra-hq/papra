import type { Logger } from '@crowlog/logger';
import type { PlanId } from '../plans/plans.constants';
import { isNil } from '../shared/utils';
import type { PlanEntitlementDefinitionRegistry } from './plan-entitlements.registry';
import type { PlanEntitlementsRepository } from './plan-entitlements.repository';
import { createLogger } from '../shared/logger/logger';

export async function resolveOrganizationPlanEntitlements({
  organizationId,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  logger = createLogger({ namespace: 'resolveOrganizationPlanEntitlements' }),
}: {
  organizationId: string;
  planEntitlementsRepository: PlanEntitlementsRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  logger?: Logger;
}): Promise<{ planId: PlanId | undefined }> {
  const { planEntitlement } = await planEntitlementsRepository.getActiveEntitlementForOrganization({
    organizationId,
  });

  if (!planEntitlement) {
    return { planId: undefined };
  }

  const { type } = planEntitlement;

  const { planEntitlementDriver } = planEntitlementDefinitionRegistry.getPlanEntitlementDriver({
    type,
  });

  if (isNil(planEntitlementDriver)) {
    logger.error({ type }, 'No plan entitlement driver found for type');

    return { planId: undefined };
  }

  const { planId } = planEntitlementDriver;

  return { planId };
}
