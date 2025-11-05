import type { Role } from './roles.types';
import { index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';

// Legacy stub for Drizzle schema - this file is no longer used in production
const usersTable = { id: '' } as any;

export const userRolesTable = sqliteTable(
  'user_roles',
  {
    ...createPrimaryKeyField({ prefix: 'rol' }),
    ...createTimestampColumns(),

    userId: text('user_id')
      .notNull()
      .references(
        () => usersTable.id,
        { onDelete: 'cascade', onUpdate: 'cascade' },
      ),

    role: text('role').notNull().$type<Role>(),
  },
  table => [
    // To enforce unique roles per user
    unique('user_roles_user_id_role_unique_index').on(table.userId, table.role),

    // To get all user for a role
    index('user_roles_role_index').on(table.role),
  ],
);
