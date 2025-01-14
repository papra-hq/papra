import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../../shared/db/columns.helpers';
import { usersTable } from '../../users/users.table';

export const sessionsTable = sqliteTable('auth_sessions', {
  ...createPrimaryKeyField({ prefix: 'auth_ses' }),
  ...createTimestampColumns(),

  token: text('token').notNull(),
  userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export const accountsTable = sqliteTable('auth_accounts', {
  ...createPrimaryKeyField({ prefix: 'auth_acc' }),
  ...createTimestampColumns(),

  userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
});

export const verificationsTable = sqliteTable('auth_verifications', {
  ...createPrimaryKeyField({ prefix: 'auth_ver' }),
  ...createTimestampColumns(),

  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});
