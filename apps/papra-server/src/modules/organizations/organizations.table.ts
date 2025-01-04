import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { ORGANIZATION_ROLE_MEMBER } from './organizations.constants';

export const organizationsTable = sqliteTable('organizations', {
  ...createPrimaryKeyField({ prefix: 'org' }),
  ...createTimestampColumns(),

  name: text('name').notNull(),
});

export const organizationUsersTable = sqliteTable('organization_users', {
  ...createPrimaryKeyField({ prefix: 'org_usr' }),
  ...createTimestampColumns(),

  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  role: text('role')
    .notNull()
    .default(ORGANIZATION_ROLE_MEMBER),
});
