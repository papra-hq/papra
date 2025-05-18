import { createPrefixedIdRegex } from '../shared/random/ids';

export const ORGANIZATION_ID_PREFIX = 'org';
export const ORGANIZATION_ID_REGEX = createPrefixedIdRegex({ prefix: ORGANIZATION_ID_PREFIX });

export const ORGANIZATION_MEMBER_ID_PREFIX = 'org_mem';
export const ORGANIZATION_MEMBER_ID_REGEX = createPrefixedIdRegex({ prefix: ORGANIZATION_MEMBER_ID_PREFIX });

export const ORGANIZATION_ROLES = {
  MEMBER: 'member',
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;

export const ORGANIZATION_ROLES_LIST = Object.values(ORGANIZATION_ROLES);

export const ORGANIZATION_INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const ORGANIZATION_INVITATION_STATUS_LIST = Object.values(ORGANIZATION_INVITATION_STATUS);
