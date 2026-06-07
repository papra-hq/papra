import { createPrefixedIdRegex } from '../shared/random/ids';

export const API_KEY_ID_PREFIX = 'ak';
export const API_KEY_ID_REGEX = createPrefixedIdRegex({ prefix: API_KEY_ID_PREFIX });

export const API_KEY_PREFIX = 'ppapi';
export const API_KEY_TOKEN_LENGTH = 64;
export const API_KEY_TOKEN_REGEX = new RegExp(`^${API_KEY_PREFIX}_[A-Za-z0-9]{${API_KEY_TOKEN_LENGTH}}$`);

export const API_KEY_PERMISSIONS = {
  ORGANIZATIONS: {
    CREATE: 'organizations:create',
    READ: 'organizations:read',
    UPDATE: 'organizations:update',
    DELETE: 'organizations:delete',
  },
  DOCUMENTS: {
    CREATE: 'documents:create',
    READ: 'documents:read',
    UPDATE: 'documents:update',
    DELETE: 'documents:delete',
  },
  TAGS: {
    CREATE: 'tags:create',
    READ: 'tags:read',
    UPDATE: 'tags:update',
    DELETE: 'tags:delete',
  },
  CUSTOM_PROPERTIES: {
    CREATE: 'custom-properties:create',
    READ: 'custom-properties:read',
    UPDATE: 'custom-properties:update',
    DELETE: 'custom-properties:delete',
  },
} as const;

export const API_KEY_PERMISSIONS_VALUES = Object.values(API_KEY_PERMISSIONS).flatMap(permissions => Object.values(permissions));
