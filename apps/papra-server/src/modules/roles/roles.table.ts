import type { Role } from './roles.types';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';

export const userRolesTable = sqliteTable('user_roles', {
  ...createPrimaryKeyField({ prefix: 'rol' }),
  ...createTimestampColumns(),

  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  role: text('role').notNull().$type<Role>(),
});
