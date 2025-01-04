import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCreatedAtField, createPrimaryKeyField } from '../../../shared/db/columns.helpers';
import { usersTable } from '../../../users/users.table';

export const authTokensTable = sqliteTable(
  'auth_tokens',
  {
    ...createPrimaryKeyField({ prefix: 'at' }),
    ...createCreatedAtField(),

    token: text('token'),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),

  },
  table => [
    // To get a token record by its value
    index('token_index').on(table.token),
    // To easily remove expired tokens
    index('expires_at_index').on(table.expiresAt),
    // To rotate tokens
    index('token_user_id_expires_at_index').on(table.token, table.userId, table.expiresAt),
  ],
);
