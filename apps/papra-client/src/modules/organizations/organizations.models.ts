import type { OrganizationMemberRole } from './organizations.types';
import { ORGANIZATION_ROLES } from './organizations.constants';

export function getIsMemberRoleDisabled({
  currentUserRole,
  memberRole,
  targetRole,
}: {
  currentUserRole?: OrganizationMemberRole;
  memberRole: OrganizationMemberRole;
  targetRole: OrganizationMemberRole;
}) {
  if (currentUserRole === ORGANIZATION_ROLES.MEMBER) {
    return true;
  }

  if (memberRole === ORGANIZATION_ROLES.OWNER) {
    return true;
  }

  if (targetRole === ORGANIZATION_ROLES.OWNER) {
    return true;
  }

  return false;
}
