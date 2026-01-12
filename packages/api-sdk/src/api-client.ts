import type { PapraDocument, PapraTag } from './api-client.types';
import type { ApiClient } from './http-client';
import { injectArguments } from '@corentinth/chisels';
import { createApiClient } from './http-client';

export const PAPRA_API_URL = 'https://api.papra.app';

export type Client = ReturnType<typeof createClient>;

export function createClient({ apiKey, apiBaseUrl = PAPRA_API_URL }: { apiKey: string; apiBaseUrl?: string }) {
  const { apiClient } = createApiClient({ apiKey, apiBaseUrl });

  const methods = injectArguments(
    {
      uploadDocument,
      listOrganizations,
      listTags,
      createTag,
      addTagToDocument,
      getCurrentApiKey,
    },
    { apiClient },
  );

  return {
    ...methods,
    forOrganization: (organizationId: string) => injectArguments(methods, { organizationId }),
  };
}

async function uploadDocument({
  file,
  organizationId,
  apiClient,
}: { file: File; organizationId: string; apiClient: ApiClient }) {
  const formData = new FormData();
  formData.append('file', file);

  return await apiClient<{ document: PapraDocument }>(`/api/organizations/${organizationId}/documents`, {
    method: 'POST',
    body: formData,
  });
}

async function listOrganizations({ apiClient }: { apiClient: ApiClient }) {
  return await apiClient<{ organizations: { id: string; name: string }[] }>('/api/organizations', {
    method: 'GET',
  });
}

async function listTags({
  organizationId,
  apiClient,
}: { organizationId: string; apiClient: ApiClient }) {
  return await apiClient<{ tags: PapraTag[] }>(`/api/organizations/${organizationId}/tags`, {
    method: 'GET',
  });
}

async function createTag({
  organizationId,
  name,
  color,
  description,
  apiClient,
}: {
  organizationId: string;
  name: string;
  color: string;
  description?: string;
  apiClient: ApiClient;
}) {
  return await apiClient<{ tag: PapraTag }>(`/api/organizations/${organizationId}/tags`, {
    method: 'POST',
    body: { name, color, description },
  });
}

async function addTagToDocument({
  organizationId,
  documentId,
  tagId,
  apiClient,
}: {
  organizationId: string;
  documentId: string;
  tagId: string;
  apiClient: ApiClient;
}) {
  return await apiClient<void>(`/api/organizations/${organizationId}/documents/${documentId}/tags`, {
    method: 'POST',
    body: { tagId },
  });
}

async function getCurrentApiKey({ apiClient }: { apiClient: ApiClient }) {
  return await apiClient<{
    apiKey: {
      id: string;
      name: string;
      permissions: string[];
    };
  }>('/api/api-keys/current', {
    method: 'GET',
  });
}
