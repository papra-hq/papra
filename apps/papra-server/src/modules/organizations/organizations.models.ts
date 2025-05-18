import type { OrganizationRole } from './organizations.types';
import { ORGANIZATION_ROLES } from './organizations.constants';

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
