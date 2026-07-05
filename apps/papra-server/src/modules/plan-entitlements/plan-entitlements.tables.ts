import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import type { PlanEntitlementSource } from './plan-entitlements.constants';
import { planEntitlementIdPrefix } from './plan-entitlements.constants';
import { usersTable } from '../users/users.table';
import type { PlanEntitlementType } from './plan-entitlements.registry';

export const planEntitlementsTable = sqliteTable('user_plan_entitlements', {
  ...createPrimaryKeyField({ prefix: planEntitlementIdPrefix }),
  ...createTimestampColumns(),

  grantedAt: integer('granted_at', { mode: 'timestamp_ms' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp_ms' }),
  userId: text('user_id')
    .references(() => usersTable.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    })
    .notNull(),
  type: text('type').notNull().$type<PlanEntitlementType>(),
  source: text('source').notNull().$type<PlanEntitlementSource>(),
});
