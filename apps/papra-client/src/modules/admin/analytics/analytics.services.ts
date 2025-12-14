import { apiClient } from '@/modules/shared/http/api-client';

export async function getUserCount() {
  const { userCount } = await apiClient<{ userCount: number }>({
    method: 'GET',
    path: '/api/admin/users/count',
  });

  return { userCount };
}

export async function getDocumentStats() {
  const stats = await apiClient<{
    documentsCount: number;
    documentsSize: number;
    deletedDocumentsCount: number;
    deletedDocumentsSize: number;
    totalDocumentsCount: number;
    totalDocumentsSize: number;
  }>({
    method: 'GET',
    path: '/api/admin/documents/stats',
  });

  return stats;
}

export async function getOrganizationCount() {
  const { organizationCount } = await apiClient<{ organizationCount: number }>({
    method: 'GET',
    path: '/api/admin/organizations/count',
  });

  return { organizationCount };
}
