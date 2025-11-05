import type { DatabaseClient } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { omitUndefined } from '../shared/utils';
import { dbToOrganizationSubscription, organizationSubscriptionToDb } from './subscriptions.models';
import type { DbInsertableOrganizationSubscription } from './subscriptions.new.tables';

export type SubscriptionsRepository = ReturnType<typeof createSubscriptionsRepository>;

export function createSubscriptionsRepository({ db }: { db: DatabaseClient }) {
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

async function getActiveOrganizationSubscription({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  // Allowlist approach: explicitly include only statuses that grant access
  // - active: paid and active subscription
  // - trialing: in trial period (has access)
  // - past_due: payment failed but still has access during grace period
  const dbSubscription = await db
    .selectFrom('organization_subscriptions')
    .where('organization_id', '=', organizationId)
    .where('status', 'in', ['active', 'trialing', 'past_due'])
    .selectAll()
    .executeTakeFirst();

  const subscription = dbToOrganizationSubscription(dbSubscription);

  return { subscription };
}

async function getAllOrganizationSubscriptions({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const dbSubscriptions = await db
    .selectFrom('organization_subscriptions')
    .where('organization_id', '=', organizationId)
    .selectAll()
    .execute();

  const subscriptions = dbSubscriptions.map(dbSub => dbToOrganizationSubscription(dbSub)).filter((sub): sub is NonNullable<typeof sub> => sub !== undefined);

  return { subscriptions };
}

async function getSubscriptionById({ subscriptionId, db }: { subscriptionId: string; db: DatabaseClient }) {
  const dbSubscription = await db
    .selectFrom('organization_subscriptions')
    .where('id', '=', subscriptionId)
    .selectAll()
    .executeTakeFirst();

  const subscription = dbToOrganizationSubscription(dbSubscription);

  return { subscription };
}

async function updateSubscription({ subscriptionId, db, ...subscription }: { subscriptionId: string; db: DatabaseClient } & Omit<Partial<DbInsertableOrganizationSubscription>, 'id'>) {
  const dbUpdatedSubscription = await db
    .updateTable('organization_subscriptions')
    .set(omitUndefined(subscription))
    .where('id', '=', subscriptionId)
    .returningAll()
    .executeTakeFirst();

  const updatedSubscription = dbToOrganizationSubscription(dbUpdatedSubscription);

  return { updatedSubscription };
}

// cspell:ignore upserted Insertable
async function upsertSubscription({ db, ...subscription }: { db: DatabaseClient } & DbInsertableOrganizationSubscription) {
  const dbUpsertedSubscription = await db
    .insertInto('organization_subscriptions')
    .values(subscription)
    .onConflict((oc) => oc
      .column('id')
      .doUpdateSet(omitUndefined(subscription)),
    )
    .returningAll()
    .executeTakeFirst();

  const upsertedSubscription = dbToOrganizationSubscription(dbUpsertedSubscription);

  return { subscription: upsertedSubscription };
}
