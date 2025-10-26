import type { Database } from '../app/database/database.types';
import type { DbInsertableSubscription } from './subscriptions.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, inArray } from 'drizzle-orm';
import { omitUndefined } from '../shared/utils';
import { organizationSubscriptionsTable } from './subscriptions.tables';

export type SubscriptionsRepository = ReturnType<typeof createSubscriptionsRepository>;

export function createSubscriptionsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getActiveOrganizationSubscription,
      getAllOrganizationSubscriptions,
      getSubscriptionById,
      updateSubscription,
      upsertSubscription,
    },
    {
      db,
    },
  );
}

async function getActiveOrganizationSubscription({ organizationId, db }: { organizationId: string; db: Database }) {
  // Allowlist approach: explicitly include only statuses that grant access
  // - active: paid and active subscription
  // - trialing: in trial period (has access)
  // - past_due: payment failed but still has access during grace period
  const [subscription] = await db
    .select()
    .from(organizationSubscriptionsTable)
    .where(
      and(
        eq(organizationSubscriptionsTable.organizationId, organizationId),
        inArray(organizationSubscriptionsTable.status, ['active', 'trialing', 'past_due']),
      ),
    );

  return { subscription };
}

async function getAllOrganizationSubscriptions({ organizationId, db }: { organizationId: string; db: Database }) {
  const subscriptions = await db
    .select()
    .from(organizationSubscriptionsTable)
    .where(
      eq(organizationSubscriptionsTable.organizationId, organizationId),
    );

  return { subscriptions };
}

async function getSubscriptionById({ subscriptionId, db }: { subscriptionId: string; db: Database }) {
  const [subscription] = await db
    .select()
    .from(organizationSubscriptionsTable)
    .where(
      eq(organizationSubscriptionsTable.id, subscriptionId),
    );

  return { subscription };
}

async function updateSubscription({ subscriptionId, db, ...subscription }: { subscriptionId: string; db: Database } & Omit<Partial<DbInsertableSubscription>, 'id'>) {
  const [updatedSubscription] = await db
    .update(organizationSubscriptionsTable)
    .set(omitUndefined(subscription))
    .where(
      eq(organizationSubscriptionsTable.id, subscriptionId),
    )
    .returning();

  return { updatedSubscription };
}

// cspell:ignore upserted Insertable
async function upsertSubscription({ db, ...subscription }: { db: Database } & DbInsertableSubscription) {
  const [upsertedSubscription] = await db
    .insert(organizationSubscriptionsTable)
    .values(subscription)
    .onConflictDoUpdate({
      target: organizationSubscriptionsTable.id,
      set: omitUndefined(subscription),
    })
    .returning();

  return { subscription: upsertedSubscription };
}
