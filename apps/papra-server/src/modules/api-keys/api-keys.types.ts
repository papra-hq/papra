import type { API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';
import type { apiKeysTable } from './api-keys.tables';

export type ApiKeyPermissions = (typeof API_KEY_PERMISSIONS_VALUES)[number];

export type ApiKey = typeof apiKeysTable.$inferSelect;
