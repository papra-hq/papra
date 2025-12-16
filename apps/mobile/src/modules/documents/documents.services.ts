import type { ApiClient } from '../api/api.client';
import type { CoerceDates, LocalDocument } from '../api/api.models';
import type { AuthClient } from '../auth/auth.client';
import type { Document } from './documents.types';
import * as FileSystem from 'expo-file-system/legacy';
import { coerceDates } from '../api/api.models';

export function getFormData(localDocument: LocalDocument): FormData {
  const formData = new FormData();
  
  // to avoid %20 in file name it is issue in react native that upload file name replaces spaces with %20
  const filename  = localDocument.name.replace(/ /g, '_');

  formData.append('file', {
    uri: localDocument.uri,
    name: filename,
    type: localDocument.type,
  } as unknown as Blob);
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
    body: getFormData(file),
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
