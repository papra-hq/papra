import type { OrganizationsRepository } from './organizations.repository';
import { createUserNotInOrganizationError } from './organizations.errors';

export async function ensureUserIsInOrganization({
  userId,
  organizationId,
  organizationsRepository,
}: {
  userId: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
}) {
  const { isInOrganization } = await organizationsRepository.isUserInOrganization({ userId, organizationId });

  if (!isInOrganization) {
    throw createUserNotInOrganizationError();
  }
}
