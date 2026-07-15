import type { Logger } from '@crowlog/logger';
import { safely } from '@corentinth/chisels';
import type { PlanId } from '../plans/plans.constants';
import { systemClock } from '../shared/clock/clock';
import type { Clock } from '../shared/clock/clock.types';
import { isNil } from '../shared/utils';
import type { UsersRepository } from '../users/users.repository';
import type { PlanEntitlementSource } from './plan-entitlements.constants';
import { PLAN_ENTITLEMENT_SOURCES } from './plan-entitlements.constants';
import {
  createPlanEntitlementAlreadyExistsError,
  createPlanEntitlementClaimsNotEnabledError,
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
  usersRepository,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  clock = systemClock,
}: {
  userId: string;
  type: PlanEntitlementType;
  source: PlanEntitlementSource;
  expiresAt?: Date | null;
  usersRepository: UsersRepository;
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

  const now = new Date(clock.now().epochMilliseconds);

  // Checked before verifying the eligibility to avoid a pointless call to the
  // driver's external verification service when the user is already entitled
  const { planEntitlement: existingPlanEntitlement } =
    await planEntitlementsRepository.getUserPlanEntitlementByType({ userId, type });

  const isExistingPlanEntitlementActive =
    existingPlanEntitlement &&
    (existingPlanEntitlement.expiresAt === null || existingPlanEntitlement.expiresAt > now);

  if (isExistingPlanEntitlementActive) {
    throw createPlanEntitlementAlreadyExistsError();
  }

  const { user } = await usersRepository.getUserByIdOrThrow({ userId });

  const isEligible = await planEntitlementDriver.verifyEligibility({ user });

  if (!isEligible) {
    throw createPlanEntitlementNotEligibleError();
  }

  if (existingPlanEntitlement) {
    // An expired entitlement of the same type is re-activated in place, as the
    // unique (userId, type) index prevents inserting a new row
    const { planEntitlement } = await planEntitlementsRepository.updatePlanEntitlement({
      planEntitlementId: existingPlanEntitlement.id,
      expiresAt: expiresAt ?? null,
      lastVerifiedAt: now,
      source,
      grantedAt: now,
    });

    return { planEntitlement };
  }

  const { planEntitlement } = await planEntitlementsRepository.createPlanEntitlement({
    userId,
    type,
    source,
    expiresAt,
    lastVerifiedAt: now,
  });

  return { planEntitlement };
}

export async function claimUserPlanEntitlement({
  userId,
  type,
  usersRepository,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  clock = systemClock,
}: {
  userId: string;
  type: PlanEntitlementType;
  usersRepository: UsersRepository;
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

  const isEnabledForNewClaims = await planEntitlementDriver.getIsEnabledForNewClaims();

  if (!isEnabledForNewClaims) {
    throw createPlanEntitlementClaimsNotEnabledError();
  }

  const expiresAt = new Date(
    clock.now().add(planEntitlementDriver.claimValidityDuration).epochMilliseconds,
  );

  return grantUserPlanEntitlement({
    userId,
    type,
    source: PLAN_ENTITLEMENT_SOURCES.USER_CLAIM,
    expiresAt,
    usersRepository,
    planEntitlementsRepository,
    planEntitlementDefinitionRegistry,
    clock,
  });
}

export async function reverifyUserClaimedPlanEntitlements({
  usersRepository,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  clock = systemClock,
  logger = createLogger({ namespace: 'reverifyUserClaimedPlanEntitlements' }),
}: {
  usersRepository: UsersRepository;
  planEntitlementsRepository: PlanEntitlementsRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  clock?: Clock;
  logger?: Logger;
}) {
  const { planEntitlements } = await planEntitlementsRepository.getActiveUserClaimedEntitlements();

  for (const planEntitlement of planEntitlements) {
    // A failure on one entitlement must not prevent the re-verification of the
    // others, it will be retried on the next run and only lapses at its expiresAt
    const [, reverificationError] = await safely(
      reverifyUserClaimedPlanEntitlement({
        planEntitlement,
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
        logger,
      }),
    );

    if (reverificationError) {
      logger.error(
        { planEntitlementId: planEntitlement.id, error: reverificationError },
        'Failed to re-verify plan entitlement',
      );
    }
  }
}

async function reverifyUserClaimedPlanEntitlement({
  planEntitlement,
  usersRepository,
  planEntitlementsRepository,
  planEntitlementDefinitionRegistry,
  clock,
  logger,
}: {
  planEntitlement: {
    id: string;
    userId: string;
    type: PlanEntitlementType;
    expiresAt: Date | null;
  };
  usersRepository: UsersRepository;
  planEntitlementsRepository: PlanEntitlementsRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  clock: Clock;
  logger: Logger;
}) {
  const { id: planEntitlementId, userId, type } = planEntitlement;

  const { planEntitlementDriver } = planEntitlementDefinitionRegistry.getPlanEntitlementDriver({
    type,
  });

  if (isNil(planEntitlementDriver)) {
    logger.error({ planEntitlementId, type }, 'No plan entitlement driver found for type');
    return;
  }

  const { user } = await usersRepository.getUserByIdOrThrow({ userId });

  const isEligible = await planEntitlementDriver.verifyEligibility({ user });

  if (!isEligible) {
    const now = clock.now();
    const graceExpiresAt = new Date(
      now.add(planEntitlementDriver.ineligibilityGraceDuration).epochMilliseconds,
    );

    // Cap the expiration to the grace period, but never extend an entitlement
    // that already expires sooner
    const shouldCapExpiration =
      planEntitlement.expiresAt === null || planEntitlement.expiresAt > graceExpiresAt;

    if (shouldCapExpiration) {
      await planEntitlementsRepository.updatePlanEntitlement({
        planEntitlementId,
        expiresAt: graceExpiresAt,
        lastVerifiedAt: new Date(now.epochMilliseconds),
      });
    }

    logger.info(
      { planEntitlementId, type },
      'User is no longer eligible for plan entitlement, expiration capped to the grace period',
    );
    return;
  }

  const now = clock.now();

  await planEntitlementsRepository.updatePlanEntitlement({
    planEntitlementId,
    expiresAt: new Date(now.add(planEntitlementDriver.claimValidityDuration).epochMilliseconds),
    lastVerifiedAt: new Date(now.epochMilliseconds),
  });
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
