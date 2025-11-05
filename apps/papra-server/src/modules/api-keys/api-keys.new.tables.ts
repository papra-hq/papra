import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';
import type { ApiKeyPermissions } from './api-keys.types';

// --- API Keys

export type ApiKeysTable = TableWithIdAndTimestamps<{
  name: string;
  key_hash: string;
  prefix: string;
  user_id: string;
  last_used_at: number | null;
  expires_at: number | null;
  permissions: string;
  all_organizations: number;
}>;

export type DbSelectableApiKey = Selectable<ApiKeysTable>;
export type DbInsertableApiKey = Insertable<ApiKeysTable>;
export type DbUpdateableApiKey = Updateable<ApiKeysTable>;

export type InsertableApiKey = BusinessInsertable<DbInsertableApiKey, {
  permissions?: ApiKeyPermissions[];
  allOrganizations?: boolean;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
}>;

export type ApiKey = Expand<CamelCaseKeys<Omit<DbSelectableApiKey, 'created_at' | 'updated_at' | 'permissions' | 'all_organizations' | 'last_used_at' | 'expires_at'> & {
  createdAt: Date;
  updatedAt: Date;
  permissions: ApiKeyPermissions[];
  allOrganizations: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}>>;

// --- API Key Organizations (Junction Table)

export type ApiKeyOrganizationsTable = {
  api_key_id: string;
  organization_member_id: string;
};

export type DbSelectableApiKeyOrganization = Selectable<ApiKeyOrganizationsTable>;
export type DbInsertableApiKeyOrganization = Insertable<ApiKeyOrganizationsTable>;
export type DbUpdateableApiKeyOrganization = Updateable<ApiKeyOrganizationsTable>;

export type InsertableApiKeyOrganization = Expand<CamelCaseKeys<DbInsertableApiKeyOrganization>>;
export type ApiKeyOrganization = Expand<CamelCaseKeys<DbSelectableApiKeyOrganization>>;
