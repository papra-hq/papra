import type { Organization } from './organizations.types';
import { apiClient } from '../shared/http/http-client';

export async function fetchOrganizations() {
  const { organizations } = await apiClient<{ organizations: Organization[] }>({
    path: '/api/organizations',
    method: 'GET',
  });

  return {
    organizations: organizations.map(organization => ({
      ...organization,
      createdAt: new Date(organization.createdAt),
      updatedAt: organization.updatedAt ? new Date(organization.updatedAt) : undefined,
    })),
  };
}

export async function createOrganization({ name }: { name: string }) {
  const { organization } = await apiClient<{ organization: Organization }>({
    path: '/api/organizations',
    method: 'POST',
    body: { name },
  });

  return {
    organization: {
      ...organization,
      createdAt: new Date(organization.createdAt),
      updatedAt: organization.updatedAt ? new Date(organization.updatedAt) : undefined,
    },
  };
}
