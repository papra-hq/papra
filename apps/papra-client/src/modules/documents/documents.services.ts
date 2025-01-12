import type { Document } from './documents.types';
import { apiClient } from '../shared/http/api-client';
import { getFormData } from '../shared/http/http-client.models';

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
    body: getFormData({ file }),
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
    query: {
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

export async function fetchOrganizationDeletedDocuments({
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
    path: `/api/organizations/${organizationId}/documents/deleted`,
    query: {
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

export async function restoreDocument({
  documentId,
  organizationId,
}: {
  documentId: string;
  organizationId: string;
}) {
  await apiClient({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents/${documentId}/restore`,
  });
}

export async function fetchDocument({
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

export async function fetchDocumentFile({
  documentId,
  organizationId,
}: {
  documentId: string;
  organizationId: string;
}) {
  const blob = await apiClient({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}/file`,
    responseType: 'blob',
  });

  return blob;
}

export async function searchDocuments({
  organizationId,
  searchQuery,
  pageIndex,
  pageSize,
}: {
  organizationId: string;
  searchQuery: string;
  pageIndex: number;
  pageSize: number;
}) {
  const {
    documents,
  } = await apiClient<{ documents: Document[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/search`,
    query: {
      searchQuery,
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
