import type { OrganizationInvitation } from './organizations.types';
import { eq, like } from 'drizzle-orm';
import { escapeLikeWildcards } from '../shared/db/sql.helpers';
import { isNilOrEmptyString } from '../shared/utils';
import { ORGANIZATION_ID_REGEX, ORGANIZATION_INVITATION_STATUS } from './organizations.constants';
import { organizationsTable } from './organizations.table';

export function ensureInvitationStatus({ invitation, now = new Date() }: { invitation?: OrganizationInvitation | null | undefined; now?: Date }) {
  if (!invitation) {
    return null;
  }

  if (invitation.status !== ORGANIZATION_INVITATION_STATUS.PENDING) {
    return invitation;
  }

  if (invitation.expiresAt > now) {
    return invitation;
  }

  return { ...invitation, status: ORGANIZATION_INVITATION_STATUS.EXPIRED };
}

export function createSearchOrganizationWhereClause({ search }: { search?: string }) {
  const trimmedSearch = search?.trim();

  if (isNilOrEmptyString(trimmedSearch)) {
    return undefined;
  }

  if (ORGANIZATION_ID_REGEX.test(trimmedSearch)) {
    return eq(organizationsTable.id, trimmedSearch);
  }

  const escapedSearch = escapeLikeWildcards(trimmedSearch);
  const likeSearch = `%${escapedSearch}%`;

  return like(organizationsTable.name, likeSearch);
}
