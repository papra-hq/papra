import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../../shared/db/columns.helpers';
import { usersTable } from '../../users/users.table';

export const sessionsTable = sqliteTable(
  'auth_sessions',
  {
    ...createPrimaryKeyField({ prefix: 'auth_ses' }),
    ...createTimestampColumns(),

    token: text('token').notNull(),
    userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    activeOrganizationId: text('active_organization_id').references(() => organizationsTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  },
  table => [
    // To select sessions by token
    index('auth_sessions_token_index').on(table.token),
  ],
);

export const accountsTable = sqliteTable(
  'auth_accounts',
  {
    ...createPrimaryKeyField({ prefix: 'auth_acc' }),
    ...createTimestampColumns(),

    userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
  },
);

export const verificationsTable = sqliteTable(
  'auth_verifications',
  {
    ...createPrimaryKeyField({ prefix: 'auth_ver' }),
    ...createTimestampColumns(),

    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  table => [
  // To select verifications by identifier
    index('auth_verifications_identifier_index').on(table.identifier),
  ],
);

export const twoFactorTable = sqliteTable(
  'auth_two_factor',
  {
    ...createPrimaryKeyField({ prefix: 'auth_2fa' }),
    ...createTimestampColumns(),

    userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    secret: text('secret'),
    backupCodes: text('backup_codes'),
    // Default to true for backfill purposes
    // from better auth : https://github.com/better-auth/better-auth/blob/4cbc823e694c1adb10ef26cf8294263453a156d3/packages/better-auth/src/plugins/two-factor/schema.ts#L42
    verified: integer('verified', { mode: 'boolean' }).notNull().default(true),
  },
);
