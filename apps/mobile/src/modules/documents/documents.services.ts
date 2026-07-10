import type { ApiClient } from '../api/api.client';
import type { CoerceDates, LocalDocument } from '../api/api.models';
import type { AuthClient } from '../auth/auth.client';
import type { Document } from './documents.types';
import * as FileSystem from 'expo-file-system/legacy';
import { coerceDates } from '../api/api.models';

export function getFormData(pojo: Record<string, string | FormDataValue | Blob>): FormData {
  const formData = new FormData();
  Object.entries(pojo).forEach(([key, value]) => formData.append(key, value));

  return formData;
}

export async function uploadDocument({
  file,
  organizationId,
  apiClient,
}: {
  file: LocalDocument;
  organizationId: string;
  apiClient: ApiClient;
}) {
  const { document } = await apiClient<{ document: Document }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents`,
    body: getFormData({
      file: {
        uri: file.uri,
        // to avoid %20 in file name it is issue in react native that upload file name replaces spaces with %20
        name: file.name.replace(/ /g, '_'),
        type: file.type ?? 'application/octet-stream',
      },
    }),
  });

  return {
    document: coerceDates(document),
  };
}

export async function fetchOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
  searchQuery,
  sortField,
  sortOrder,

  apiClient,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  searchQuery?: string;
  sortField?: 'createdAt' | 'updatedAt' | 'name' | 'documentDate';
  sortOrder?: 'asc' | 'desc';

  apiClient: ApiClient;
}) {
  const { documents, documentsCount } = await apiClient<{
    documents: Document[];
    documentsCount: number;
  }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents`,
    query: {
      searchQuery,
      pageIndex,
      pageSize,
      sortField,
      sortOrder,
    },
  });

  return {
    documentsCount,
    documents: documents.map(coerceDates),
  };
}

export async function deleteDocument({
  organizationId,
  documentId,
  apiClient,
}: {
  organizationId: string;
  documentId: string;
  apiClient: ApiClient;
}) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });
}

export async function fetchDocument({
  organizationId,
  documentId,
  apiClient,
}: {
  organizationId: string;
  documentId: string;
  apiClient: ApiClient;
}) {
  const { document } = await apiClient<{ document: Document }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });
  return {
    document: coerceDates(document),
  };
}

export async function fetchDocumentFile({
  document,
  organizationId,
  baseUrl,
  authClient,
}: {
  document: CoerceDates<Document>;
  organizationId: string;
  baseUrl: string;
  authClient: AuthClient;
}) {
  const cookies = authClient.getCookie();
  const uri = `${baseUrl}/api/organizations/${organizationId}/documents/${document.id}/file`;
  const headers = {
    'Cookie': cookies,
    'Content-Type': document.mimeType,
  };
  // Use cacheDirectory for better app compatibility
  const fileUri = `${FileSystem.cacheDirectory}${document.name}`;

  // Download the file with authentication headers
  const downloadResult = await FileSystem.downloadAsync(uri, fileUri, {
    headers,
  });

  if (downloadResult.status === 200) {
    return downloadResult.uri;
  } else {
    throw new Error(`Download failed with status: ${downloadResult.status}`);
  }
}
