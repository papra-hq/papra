import type { OrganizationInvitation } from './organizations.types';
import { isAfter } from 'date-fns';
import { ORGANIZATION_INVITATION_STATUS } from './organizations.constants';

export function ensureInvitationStatus({ invitation, now = new Date() }: { invitation?: OrganizationInvitation | null | undefined; now?: Date }) {
  if (!invitation) {
    return null;
  }

  if (invitation.status !== ORGANIZATION_INVITATION_STATUS.PENDING) {
    return invitation;
  }

  if (invitation.expiresAt && isAfter(invitation.expiresAt, now)) {
    return invitation;
  }

  return { ...invitation, status: ORGANIZATION_INVITATION_STATUS.EXPIRED };
}
