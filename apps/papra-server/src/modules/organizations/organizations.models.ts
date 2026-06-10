import type { Config } from '../config/config.types';
import type { OrganizationRole } from './organizations.types';
import { generateId } from '../shared/random/ids';
import { ORGANIZATION_ID_PREFIX, ORGANIZATION_ROLES } from './organizations.constants';

export function canUserRemoveMemberFromOrganization({
  userRole,
  memberRole,
}: {
  userRole: OrganizationRole;
  memberRole: OrganizationRole;
}) {
  if (memberRole === ORGANIZATION_ROLES.OWNER) {
    return false;
  }

  if (![ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.OWNER].includes(userRole)) {
    return false;
  }

  return true;
}

export function generateOrganizationId() {
  return generateId({ prefix: ORGANIZATION_ID_PREFIX });
}

export function getUserMaxOrganizationCount({
  user,
  config,
}: {
  user: { maxOrganizationCount?: number | null };
  config: Config;
}) {
  return user.maxOrganizationCount ?? config.organizations.maxOrganizationCount;
}
