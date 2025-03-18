import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';

export const organizationSubscriptionsTable = sqliteTable('organization_subscriptions', {
  ...createPrimaryKeyField({ prefix: 'org_sub' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  planId: text('plan_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }).notNull(),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp_ms' }).notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
});
