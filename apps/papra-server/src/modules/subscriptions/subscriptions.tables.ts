import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createTimestampColumns } from '../shared/db/columns.helpers';

export const organizationSubscriptionsTable = sqliteTable('organization_subscriptions', {
  // stripe subscription id, no auto-generated id
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  planId: text('plan_id').notNull(),
  status: text('status').notNull(),
  seatsCount: integer('seats_count', { mode: 'number' }).notNull(),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }).notNull(),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp_ms' }).notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),

  ...createTimestampColumns(),

});
