import type { Logger } from '@crowlog/logger';
import type { PlanId } from '../plans/plans.constants';
import { systemClock } from '../shared/clock/clock';
import type { Clock } from '../shared/clock/clock.types';
import { isNil } from '../shared/utils';
import type { PlanEntitlementSource } from './plan-entitlements.constants';
import {
  createPlanEntitlementNotEligibleError,
  createPlanEntitlementUnknownTypeError,
} from './plan-entitlements.errors';
import type {
  PlanEntitlementDefinitionRegistry,
  PlanEntitlementType,
} from './plan-entitlements.registry';
import type { PlanEntitlementsRepository } from './plan-entitlements.repository';
import { createLogger } from '../shared/logger/logger';

export async function grantUserPlanEntitlement({
  userId,
  type,
  source,
  expiresAt,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  clock = systemClock,
}: {
  userId: string;
  type: PlanEntitlementType;
  source: PlanEntitlementSource;
  expiresAt?: Date | null;
  planEntitlementsRepository: PlanEntitlementsRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  clock?: Clock;
}) {
  const { planEntitlementDriver } = planEntitlementDefinitionRegistry.getPlanEntitlementDriver({
    type,
  });

  if (isNil(planEntitlementDriver)) {
    throw createPlanEntitlementUnknownTypeError();
  }

  const isEligible = await planEntitlementDriver.verifyEligibility({ userId });

  if (!isEligible) {
    throw createPlanEntitlementNotEligibleError();
  }

  const { planEntitlement } = await planEntitlementsRepository.createPlanEntitlement({
    userId,
    type,
    source,
    expiresAt,
    lastVerifiedAt: new Date(clock.now().epochMilliseconds),
  });

  return { planEntitlement };
}

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
