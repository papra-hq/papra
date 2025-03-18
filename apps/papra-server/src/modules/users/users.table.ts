import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';

export const usersTable = sqliteTable(
  'users',
  {
    ...createPrimaryKeyField({ prefix: 'usr' }),
    ...createTimestampColumns(),

    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    stripeCustomerId: text('customer_id').unique(),
    name: text('name'),
    image: text('image'),
    maxOrganizationCount: integer('max_organization_count', { mode: 'number' }),
  },
  table => [
    index('users_email_index').on(table.email),
  ],
);
