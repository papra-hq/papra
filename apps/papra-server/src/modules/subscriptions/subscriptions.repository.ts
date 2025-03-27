import type { Database } from '../app/database/database.types';
import type { DbInsertableSubscription } from './subscriptions.types';
import { injectArguments } from '@corentinth/chisels';
import { eq } from 'drizzle-orm';
import { omitUndefined } from '../shared/utils';
import { organizationSubscriptionsTable } from './subscriptions.tables';

export type SubscriptionsRepository = ReturnType<typeof createSubscriptionsRepository>;

export function createSubscriptionsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationSubscription,
      createSubscription,
      updateSubscription,
    },
    {
      db,
    },
  );
}

async function getOrganizationSubscription({ organizationId, db }: { organizationId: string; db: Database }) {
  const [subscription] = await db
    .select()
    .from(organizationSubscriptionsTable)
    .where(
      eq(organizationSubscriptionsTable.organizationId, organizationId),
    );

  return { subscription };
}

async function createSubscription({ db, ...subscription }: { db: Database } & DbInsertableSubscription) {
  const [createdSubscription] = await db.insert(organizationSubscriptionsTable).values(subscription).returning();

  return { createdSubscription };
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
