import { createPrefixedIdRegex } from '../shared/random/ids';

export const API_KEY_ID_PREFIX = 'ak';
export const API_KEY_ID_REGEX = createPrefixedIdRegex({ prefix: API_KEY_ID_PREFIX });

export const API_KEY_PREFIX = 'ppapi';
export const API_KEY_TOKEN_LENGTH = 64;

export const API_KEY_PERMISSIONS = {
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
} as const;

export const API_KEY_PERMISSIONS_VALUES = Object.values(API_KEY_PERMISSIONS).flatMap(permissions => Object.values(permissions));
