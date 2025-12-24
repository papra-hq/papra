import type { IntakeEmail } from '@/modules/intake-emails/intake-emails.types';
import type { Organization } from '@/modules/organizations/organizations.types';
import type { User } from '@/modules/users/users.types';
import type { Webhook } from '@/modules/webhooks/webhooks.types';
import { apiClient } from '@/modules/shared/http/api-client';

export type OrganizationWithMemberCount = Organization & { memberCount: number };

export type OrganizationMember = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: string;
  user: User;
};

export type OrganizationStats = {
  documentsCount: number;
  documentsSize: number;
  deletedDocumentsCount: number;
  deletedDocumentsSize: number;
  totalDocumentsCount: number;
  totalDocumentsSize: number;
};

export async function listOrganizations({ search, pageIndex = 0, pageSize = 25 }: { search?: string; pageIndex?: number; pageSize?: number }) {
  const { totalCount, organizations } = await apiClient<{
    organizations: OrganizationWithMemberCount[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
  }>({
    method: 'GET',
    path: '/api/admin/organizations',
    query: { search, pageIndex, pageSize },
  });

  return { pageIndex, pageSize, totalCount, organizations };
}

export async function getOrganizationBasicInfo({ organizationId }: { organizationId: string }) {
  const { organization } = await apiClient<{
    organization: Organization;
  }>({
    method: 'GET',
    path: `/api/admin/organizations/${organizationId}`,
  });

  return { organization };
}

export async function getOrganizationMembers({ organizationId }: { organizationId: string }) {
  const { members } = await apiClient<{
    members: OrganizationMember[];
  }>({
    method: 'GET',
    path: `/api/admin/organizations/${organizationId}/members`,
  });

  return { members };
}

export async function getOrganizationIntakeEmails({ organizationId }: { organizationId: string }) {
  const { intakeEmails } = await apiClient<{
    intakeEmails: IntakeEmail[];
  }>({
    method: 'GET',
    path: `/api/admin/organizations/${organizationId}/intake-emails`,
  });

  return { intakeEmails };
}

export async function getOrganizationWebhooks({ organizationId }: { organizationId: string }) {
  const { webhooks } = await apiClient<{
    webhooks: Webhook[];
  }>({
    method: 'GET',
    path: `/api/admin/organizations/${organizationId}/webhooks`,
  });

  return { webhooks };
}

export async function getOrganizationStats({ organizationId }: { organizationId: string }) {
  const { stats } = await apiClient<{
    stats: OrganizationStats;
  }>({
    method: 'GET',
    path: `/api/admin/organizations/${organizationId}/stats`,
  });

  return { stats };
}
