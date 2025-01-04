import type { OrganizationsRepository } from './organizations.repository';
import { ORGANIZATION_ROLE_OWNER } from './organizations.constants';

export async function createOrganization({ name, userId, organizationsRepository }: { name: string; userId: string; organizationsRepository: OrganizationsRepository }) {
  const { organization } = await organizationsRepository.saveOrganization({ organization: { name } });

  await organizationsRepository.addUserToOrganization({ userId, organizationId: organization.id, role: ORGANIZATION_ROLE_OWNER });

  return { organization };
}
