export const ORGANIZATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
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
