import type { Organization } from '@/modules/organizations/organizations.types';
import type { User } from '@/modules/users/users.types';
import { apiClient } from '@/modules/shared/http/api-client';

export type UserWithOrganizationCount = User & { organizationCount: number };

export type UserPlanEntitlement = {
  id: string;
  type: string;
  source: string;
  grantedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listUsers({
  search,
  pageIndex = 0,
  pageSize = 25,
}: {
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}) {
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
  const { organizations, roles, user, planEntitlements, availablePlanEntitlementTypes } =
    await apiClient<{
      user: User;
      organizations: Organization[];
      roles: string[];
      planEntitlements: UserPlanEntitlement[];
      availablePlanEntitlementTypes: string[];
    }>({
      method: 'GET',
      path: `/api/admin/users/${userId}`,
    });

  return { organizations, roles, user, planEntitlements, availablePlanEntitlementTypes };
}

export async function grantPlanEntitlement({
  userId,
  type,
  expiresAt,
}: {
  userId: string;
  type: string;
  expiresAt?: Date | null;
}) {
  await apiClient({
    method: 'POST',
    path: `/api/admin/users/${userId}/plan-entitlements`,
    body: { type, expiresAt: expiresAt ? expiresAt.toISOString() : undefined },
  });
}

export async function revokePlanEntitlement({
  userId,
  planEntitlementId,
}: {
  userId: string;
  planEntitlementId: string;
}) {
  await apiClient({
    method: 'DELETE',
    path: `/api/admin/users/${userId}/plan-entitlements/${planEntitlementId}`,
  });
}

export async function deleteUser({ userId }: { userId: string }) {
  await apiClient({
    method: 'DELETE',
    path: `/api/admin/users/${userId}`,
  });
}
