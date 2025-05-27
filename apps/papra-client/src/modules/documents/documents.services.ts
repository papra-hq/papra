import type { AsDto } from '../shared/http/http-client.types';
import type { Document } from './documents.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates, getFormData } from '../shared/http/http-client.models';

export async function uploadDocument({
  file,
  organizationId,
}: {
  file: File;
  organizationId: string;
}) {
  const { document } = await apiClient<{ document: AsDto<Document> }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents`,
    body: getFormData({ file }),
  });

  return {
    document: coerceDates(document),
  };
}

export async function fetchOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
  filters,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  filters?: {
    tags?: string[];
  };
}) {
  const {
    documents,
    documentsCount,
  } = await apiClient<{ documents: AsDto<Document>[]; documentsCount: number }>({
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
    documents: documents.map(coerceDates),
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
  } = await apiClient<{ documents: AsDto<Document>[]; documentsCount: number }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/deleted`,
    query: {
      pageIndex,
      pageSize,
    },
  });

  return {
    documentsCount,
    documents: documents.map(coerceDates),
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
  const { document } = await apiClient<{ document: AsDto<Document> }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });

  return {
    document: coerceDates(document),
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
  } = await apiClient<{ documents: AsDto<Document>[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/search`,
    query: {
      searchQuery,
      pageIndex,
      pageSize,
    },
  });

  return {
    documents: documents.map(coerceDates),
  };
}

export async function getOrganizationDocumentsStats({ organizationId }: { organizationId: string }) {
  const { organizationStats } = await apiClient<{ organizationStats: { documentsCount: number; documentsSize: number } }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/statistics`,
  });

  return { organizationStats };
}

export async function deleteAllTrashDocuments({ organizationId }: { organizationId: string }) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/documents/trash`,
  });
}

export async function deleteTrashDocument({ documentId, organizationId }: { documentId: string; organizationId: string }) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/documents/trash/${documentId}`,
  });
}

export async function updateDocument({
  documentId,
  organizationId,
  content,
  name,
}: {
  documentId: string;
  organizationId: string;
  content?: string;
  name?: string;
}) {
  const { document } = await apiClient<{ document: AsDto<Document> }>({
    method: 'PATCH',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
    body: { content, name },
  });

  return {
    document: coerceDates(document),
  };
}
