import type { Organization, OrganizationWithStats } from './organizations.types';
import { apiClient } from '../shared/http/api-client';

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

export async function updateOrganization({ organizationId, name }: { organizationId: string; name: string }) {
  const { organization } = await apiClient<{ organization: Organization }>({
    path: `/api/organizations/${organizationId}`,
    method: 'PUT',
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

export async function fetchOrganization({ organizationId }: { organizationId: string }) {
  const { organization } = await apiClient<{ organization: OrganizationWithStats }>({
    path: `/api/organizations/${organizationId}`,
    method: 'GET',
  });

  return {
    organization: {
      ...organization,
      createdAt: new Date(organization.createdAt),
      updatedAt: organization.updatedAt ? new Date(organization.updatedAt) : undefined,
    },
  };
}

export async function deleteOrganization({ organizationId }: { organizationId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}`,
    method: 'DELETE',
  });
}
