import type { OrganizationsRepository } from './organizations.repository';
import { ORGANIZATION_ROLE_OWNER } from './organizations.constants';
import { createUserNotInOrganizationError } from './organizations.errors';

export async function createOrganization({ name, userId, organizationsRepository }: { name: string; userId: string; organizationsRepository: OrganizationsRepository }) {
  const { organization } = await organizationsRepository.saveOrganization({ organization: { name } });

  await organizationsRepository.addUserToOrganization({
    userId,
    organizationId: organization.id,
    role: ORGANIZATION_ROLE_OWNER,
  });

  return { organization };
}

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
