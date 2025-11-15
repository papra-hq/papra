import type { ApiClient } from '../api/api.client';

export function getFormData(pojo: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(pojo).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

export async function uploadDocument({
  file,
  organizationId,

  apiClient,
}: {
  file: File;
  organizationId: string;

  apiClient: ApiClient;
}) {
  const { document } = await apiClient<{ document: unknown }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents`,
    body: getFormData({ file }),
  });

  return {
    document,
  };
}

export async function fetchOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
  filters,

  apiClient,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  filters?: {
    tags?: string[];
  };

  apiClient: ApiClient;
}) {
  const {
    documents,
    documentsCount,
  } = await apiClient<{ documents: unknown[]; documentsCount: number }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents`,
    query: {
      pageIndex,
      pageSize,
      ...filters,
    },
  });

  return {
    documentsCount,
    documents,
  };
}
