export const organizationIdRegex = /^org_[a-z0-9]{24}$/;

export const ORGANIZATION_ROLES = {
  MEMBER: 'member',
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;
