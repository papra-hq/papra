import {
  API_KEY_PERMISSIONS_VALUES,
  API_KEY_PERMISSIONS as PERMISSIONS,
} from '@papra/app-server/apiKeys/constants';

export const API_KEY_PERMISSIONS = [
  { section: 'organizations', permissions: Object.values(PERMISSIONS.ORGANIZATIONS) },
  { section: 'documents', permissions: Object.values(PERMISSIONS.DOCUMENTS) },
  { section: 'folders', permissions: Object.values(PERMISSIONS.FOLDERS) },
  { section: 'tags', permissions: Object.values(PERMISSIONS.TAGS) },
  { section: 'custom-properties', permissions: Object.values(PERMISSIONS.CUSTOM_PROPERTIES) },
] as const;

export { API_KEY_PERMISSIONS_VALUES };
