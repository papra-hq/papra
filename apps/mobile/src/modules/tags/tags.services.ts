import type { ApiClient } from '../api/api.client';
import type { Tag } from './tags.types';

export async function fetchTags({
  organizationId,
  apiClient,
}: {
  organizationId: string;
  apiClient: ApiClient;
}) {
  return apiClient<{ tags: Tag[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/tags`,
  });
}

type DocumentTagOptions = {
  organizationId: string;
  documentId: string;
  tagId: string;
  apiClient: ApiClient;
};

export async function addTagToDocument({
  organizationId,
  documentId,
  tagId,
  apiClient,
}: DocumentTagOptions) {
  await apiClient({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents/${documentId}/tags`,
    body: { tagId },
  });
}

export async function removeTagFromDocument({
  organizationId,
  documentId,
  tagId,
  apiClient,
}: DocumentTagOptions) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/documents/${documentId}/tags/${tagId}`,
  });
}
