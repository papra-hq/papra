import type { Database } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { eq } from 'drizzle-orm';
import { organizationSubscriptionsTable } from './subscriptions.tables';

export type SubscriptionsRepository = ReturnType<typeof createSubscriptionsRepository>;

export function createSubscriptionsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationSubscription,
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
