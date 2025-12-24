import type { ApiClient } from '../api/api.client';
import type { CoerceDates, LocalDocument } from '../api/api.models';
import type { AuthClient } from '../auth/auth.client';
import type { Document } from './documents.types';
import * as FileSystem from 'expo-file-system/legacy';
import { coerceDates } from '../api/api.models';
import { documentsLocalStorage } from './documents.local-storage';

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
        type: file.type ?? 'application/json',
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
    const remote = apiDocuments.map(coerceDates);
    const local = await documentsLocalStorage.getUnsyncedDocumentsByOrganization(organizationId);
    const documents = [...local, ...remote];
    return {
      documentsCount: documentsCount + local.length,
      documents: documents.map(coerceDates),
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
    'Content-Type': 'application/json',
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
