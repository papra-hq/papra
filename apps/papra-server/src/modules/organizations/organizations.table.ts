import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { ORGANIZATION_ID_PREFIX } from './organizations.constants';

export const organizationsTable = sqliteTable('organizations', {
  ...createPrimaryKeyField({ prefix: ORGANIZATION_ID_PREFIX }),
  ...createTimestampColumns(),

  name: text('name').notNull(),
  customerId: text('customer_id'),
});

export const organizationMembersTable = sqliteTable('organization_members', {
  ...createPrimaryKeyField({ prefix: 'org_mem' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  role: text('role').notNull(),
}, t => [
  unique('organization_members_user_organization_unique').on(t.organizationId, t.userId),
]);

export const organizationInvitationsTable = sqliteTable('organization_invitations', {
  ...createPrimaryKeyField({ prefix: 'org_inv' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  inviterId: text('inviter_id').notNull().references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});
