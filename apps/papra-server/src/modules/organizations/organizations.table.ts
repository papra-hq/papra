import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';

export const organizationsTable = sqliteTable('organizations', {
  ...createPrimaryKeyField({ prefix: 'org' }),
  ...createTimestampColumns(),

  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  metadata: text('metadata'),
});

export const organizationMembersTable = sqliteTable('organization_members', {
  ...createPrimaryKeyField({ prefix: 'org_mem' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  role: text('role').notNull(),
});

export const organizationInvitationsTable = sqliteTable('organization_invitations', {
  ...createPrimaryKeyField({ prefix: 'org_inv' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  inviterId: text('inviter_id').notNull().references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});
