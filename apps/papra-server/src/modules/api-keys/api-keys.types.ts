import type { API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';

export type ApiKeyPermissions = (typeof API_KEY_PERMISSIONS_VALUES)[number];

// Re-export types from tables for backward compatibility
export type { ApiKey, ApiKeyOrganization, InsertableApiKey, InsertableApiKeyOrganization } from './api-keys.new.tables';
