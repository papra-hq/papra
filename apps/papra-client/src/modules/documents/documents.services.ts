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
  const {
    documents,
    documentsCount,
  } = await apiClient<{ documents: Document[]; documentsCount: number }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents`,
    queryParams: {
      pageIndex,
      pageSize,
    },
  });

  return {
    documentsCount,
    documents: documents.map(document => ({
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : undefined,
    })),
  };
}

export async function deleteDocument({
  documentId,
  organizationId,
}: {
  documentId: string;
  organizationId: string;
}) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });
}

export async function getDocument({
  documentId,
  organizationId,
}: {
  documentId: string;
  organizationId: string;
}) {
  const { document } = await apiClient<{ document: Document }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });

  return {
    document: {
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : undefined,
    },
  };
}
