import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';

export const usersTable = sqliteTable(
  'users',
  {
    ...createPrimaryKeyField({ prefix: 'usr' }),
    ...createTimestampColumns(),

    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    name: text('name'),
    image: text('image'),
  },
  table => [
    index('users_email_index').on(table.email),
  ],
);
