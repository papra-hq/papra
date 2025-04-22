import type { ApiKeyPermissions } from './api-keys.types';

import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationMembersTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';

export const apiKeysTable = sqliteTable(
  'api_keys',
  {
    ...createPrimaryKeyField({ prefix: 'ak' }),
    ...createTimestampColumns(),

    name: text('name').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    // the prefix is used to identify the key, it is the
    prefix: text('prefix').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    permissions: text('permissions', { mode: 'json' }).notNull().$type<ApiKeyPermissions[]>().default([]),
    allOrganizations: integer('all_organizations', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    // To get an API key by its token
    index('key_hash_index').on(table.keyHash),
  ],
);

// We use an intermediate table (instead of a json array) to link API keys to organization members, so the relationship between
// the api key and the organization is deleted on cascade when the organization is deleted or the member is removed from the organization.
export const apiKeyOrganizationsTable = sqliteTable('api_key_organizations', {
  apiKeyId: text('api_key_id')
    .notNull()
    .references(() => apiKeysTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  organizationMemberId: text('organization_member_id')
    .notNull()
    .references(() => organizationMembersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});
