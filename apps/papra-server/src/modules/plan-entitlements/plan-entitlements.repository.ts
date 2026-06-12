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
  return injectArguments({ getActiveEntitlementForOrganization }, { db, clock, logger });
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
