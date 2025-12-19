import type { Organization } from '@/modules/organizations/organizations.types';
import type { User } from '@/modules/users/users.types';
import { apiClient } from '@/modules/shared/http/api-client';

export type UserWithOrganizationCount = User & { organizationCount: number };

export async function listUsers({ search, pageIndex = 0, pageSize = 25 }: { search?: string; pageIndex?: number; pageSize?: number }) {
  const { totalCount, users } = await apiClient<{
    users: UserWithOrganizationCount[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
  }>({
    method: 'GET',
    path: '/api/admin/users',
    query: { search, pageIndex, pageSize },
  });

  return { pageIndex, pageSize, totalCount, users };
}

export async function getUserDetail({ userId }: { userId: string }) {
  const { organizations, roles, user } = await apiClient<{
    user: User;
    organizations: Organization[];
    roles: string[];
  }>({
    method: 'GET',
    path: `/api/admin/users/${userId}`,
  });

  return { organizations, roles, user };
}
