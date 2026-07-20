import { injectArguments } from '@corentinth/chisels';
import type { Database } from '../app/database/database.types';
import { planEntitlementsTable } from './plan-entitlements.tables';
import { and, eq, getTableColumns, gt, isNull, or } from 'drizzle-orm';
import { systemClock } from '../shared/clock/clock';
import type { Clock } from '../shared/clock/clock.types';
import { organizationMembersTable } from '../organizations/organizations.table';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import type { Logger } from '@crowlog/logger';
import { createLogger } from '../shared/logger/logger';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import type { PlanEntitlementSource } from './plan-entitlements.constants';
import { PLAN_ENTITLEMENT_SOURCES } from './plan-entitlements.constants';
import type { PlanEntitlementType } from './plan-entitlements.registry';
import {
  createPlanEntitlementAlreadyExistsError,
  createPlanEntitlementNotFoundError,
} from './plan-entitlements.errors';

export type PlanEntitlementsRepository = ReturnType<typeof createPlanEntitlementsRepository>;

export function createPlanEntitlementsRepository({
  db,
  clock,
  logger,
}: {
  db: Database;
  clock?: Clock;
  logger?: Logger;
}) {
  return injectArguments(
    {
      getActiveEntitlementForOrganization,
      getActiveUserClaimedEntitlements,
      getUserPlanEntitlements,
      getUserPlanEntitlementByType,
      createPlanEntitlement,
      updatePlanEntitlement,
      deleteUserPlanEntitlement,
    },
    { db, clock, logger },
  );
}

async function getUserPlanEntitlements({ db, userId }: { db: Database; userId: string }) {
  const planEntitlements = await db
    .select()
    .from(planEntitlementsTable)
    .where(eq(planEntitlementsTable.userId, userId));

  return { planEntitlements };
}

async function createPlanEntitlement({
  db,
  userId,
  type,
  source,
  expiresAt,
  lastVerifiedAt,
  clock = systemClock,
}: {
  db: Database;
  userId: string;
  type: PlanEntitlementType;
  source: PlanEntitlementSource;
  expiresAt?: Date | null;
  lastVerifiedAt?: Date | null;
  clock?: Clock;
}) {
  try {
    const [planEntitlement] = await db
      .insert(planEntitlementsTable)
      .values({
        userId,
        type,
        source,
        expiresAt: expiresAt ?? null,
        lastVerifiedAt: lastVerifiedAt ?? null,
        grantedAt: new Date(clock.now().epochMilliseconds),
      })
      .returning();

    return { planEntitlement };
  } catch (error) {
    if (isUniqueConstraintError({ error })) {
      throw createPlanEntitlementAlreadyExistsError();
    }

    throw error;
  }
}

async function deleteUserPlanEntitlement({
  db,
  planEntitlementId,
  userId,
}: {
  db: Database;
  planEntitlementId: string;
  userId: string;
}) {
  const deleted = await db
    .delete(planEntitlementsTable)
    .where(
      and(
        eq(planEntitlementsTable.id, planEntitlementId),
        eq(planEntitlementsTable.userId, userId),
      ),
    )
    .returning({ id: planEntitlementsTable.id });

  if (deleted.length === 0) {
    throw createPlanEntitlementNotFoundError();
  }
}

async function getActiveUserClaimedEntitlements({
  db,
  clock = systemClock,
}: {
  db: Database;
  clock?: Clock;
}) {
  const now = new Date(clock.now().epochMilliseconds);

  const planEntitlements = await db
    .select()
    .from(planEntitlementsTable)
    .where(
      and(
        eq(planEntitlementsTable.source, PLAN_ENTITLEMENT_SOURCES.USER_CLAIM),
        or(isNull(planEntitlementsTable.expiresAt), gt(planEntitlementsTable.expiresAt, now)),
      ),
    );

  return { planEntitlements };
}

async function getUserPlanEntitlementByType({
  db,
  userId,
  type,
}: {
  db: Database;
  userId: string;
  type: PlanEntitlementType;
}) {
  const [planEntitlement] = await db
    .select()
    .from(planEntitlementsTable)
    .where(and(eq(planEntitlementsTable.userId, userId), eq(planEntitlementsTable.type, type)));

  return { planEntitlement };
}

async function updatePlanEntitlement({
  db,
  planEntitlementId,
  expiresAt,
  lastVerifiedAt,
  source,
  grantedAt,
}: {
  db: Database;
  planEntitlementId: string;
  expiresAt: Date | null;
  lastVerifiedAt: Date;
  source?: PlanEntitlementSource;
  grantedAt?: Date;
}) {
  const [planEntitlement] = await db
    .update(planEntitlementsTable)
    .set({
      expiresAt,
      lastVerifiedAt,
      ...(source ? { source } : {}),
      ...(grantedAt ? { grantedAt } : {}),
    })
    .where(eq(planEntitlementsTable.id, planEntitlementId))
    .returning();

  if (!planEntitlement) {
    throw createPlanEntitlementNotFoundError();
  }

  return { planEntitlement };
}

async function getActiveEntitlementForOrganization({
  db,
  organizationId,
  clock = systemClock,
  logger = createLogger({ namespace: 'planEntitlementsRepository' }),
}: {
  db: Database;
  organizationId: string;
  clock?: Clock;
  logger?: Logger;
}) {
  const now = clock.now().epochMilliseconds;

  const entitlements = await db
    .select({ planEntitlements: getTableColumns(planEntitlementsTable) })
    .from(planEntitlementsTable)
    .innerJoin(
      organizationMembersTable,
      eq(planEntitlementsTable.userId, organizationMembersTable.userId),
    )
    .where(
      and(
        eq(organizationMembersTable.organizationId, organizationId),
        eq(organizationMembersTable.role, ORGANIZATION_ROLES.OWNER),
        or(
          isNull(planEntitlementsTable.expiresAt),
          gt(planEntitlementsTable.expiresAt, new Date(now)),
        ),
      ),
    );

  if (entitlements.length > 1) {
    logger.warn(
      {
        organizationId,
        ownerUserIds: entitlements.map((e) => e.planEntitlements.userId),
        entitlementIds: entitlements.map((e) => e.planEntitlements.id),
      },
      'Multiple active entitlements found for organization, returning the most recent one based on grantedAt',
    );
  }

  const mostRecentEntitlement = entitlements.reduce((mostRecent, current) => {
    if (!mostRecent) {
      return current;
    }

    return current.planEntitlements.grantedAt > mostRecent.planEntitlements.grantedAt
      ? current
      : mostRecent;
  }, entitlements[0]);

  return {
    planEntitlement: mostRecentEntitlement?.planEntitlements,
  };
}
