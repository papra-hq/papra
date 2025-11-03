import type { ApiClient } from '../api/api.client';
import type { Organization } from '@/modules/organizations/organizations.types';

export async function fetchOrganizations({ apiClient }: { apiClient: ApiClient }) {
  return apiClient<{
    organizations: Organization[];
  }>({
    method: 'GET',
    path: '/api/organizations',
  });
}

export async function createOrganization({ name, apiClient }: { name: string; apiClient: ApiClient }) {
  return apiClient<{
    organization: {
      id: string;
      name: string;
    };
  }>({
    method: 'POST',
    path: '/api/organizations',
    body: { name },
  });
}
