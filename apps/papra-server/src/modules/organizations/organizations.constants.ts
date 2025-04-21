import { createPrefixedIdRegex } from '../shared/random/ids';

export const ORGANIZATION_ID_PREFIX = 'org';
export const ORGANIZATION_ID_REGEX = createPrefixedIdRegex({ prefix: ORGANIZATION_ID_PREFIX });

export const ORGANIZATION_ROLES = {
  MEMBER: 'member',
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;
