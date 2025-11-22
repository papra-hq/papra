import type { ApiClient } from '../api/api.client';
import type { Document } from './documents.types';
import { coerceDates } from '../api/api.models';
import { AuthClient } from '../auth/auth.client';
import * as FileSystem from 'expo-file-system/legacy';


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
  file: Blob;
  organizationId: string;

  apiClient: ApiClient;
}) {
  const { document } = await apiClient<{ document: Document }>({
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
    documents: apiDocuments,
    documentsCount,
  } = await apiClient<{ documents: Document[]; documentsCount: number }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents`,
    query: {
      pageIndex,
      pageSize,
      ...filters,
    },
  });

  try {
    const documents = apiDocuments.map(coerceDates);

    return {
      documentsCount,
      documents,
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
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
  return await apiClient<{ document: Document }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}`,
  });
}

export async function fetchDocumentFile({
  document,
  organizationId,
  baseUrl,
  authClient,
}: {
  document: Document;
  organizationId: string;
  baseUrl: string,
  authClient: AuthClient;
}) {
  const cookies = await authClient.getCookie();
  const uri = `${baseUrl}/api/organizations/${organizationId}/documents/${document.id}/file`;
  const headers = {
    'Cookie': cookies,
    'Content-Type': 'application/json',
  };
  // Use documentDirectory for better app compatibility
  const fileUri = `${FileSystem.documentDirectory}${document.name}`;

  // Download the file with authentication headers
  const downloadResult = await FileSystem.downloadAsync(uri,
    fileUri,
    {
      headers: headers,
    }
  );

  if (downloadResult.status === 200) {
    return downloadResult.uri;
  } else {
    throw new Error('Download failed');
  }
}