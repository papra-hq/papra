import type { Document } from './documents.types';
import { apiClient } from '../shared/http/http-client';

export async function uploadDocument({
  file,
  organizationId,

}: {
  file: File;
  organizationId: string;
}) {
  const { document } = await apiClient<{ document: Document }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents`,
    formData: {
      file,
    },
  });

  return {
    document: {
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : undefined,
    },
  };
}

export async function fetchOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
}) {
  const { documents } = await apiClient<{ documents: Document[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents`,
    queryParams: {
      pageIndex,
      pageSize,
    },
  });

  return {
    documents: documents.map(document => ({
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : undefined,
    })),
  };
}
