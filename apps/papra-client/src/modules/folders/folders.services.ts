import type { AsDto } from '../shared/http/http-client.types';
import type { Document } from '../documents/documents.types';
import type { Folder } from './folders.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchOrganizationFolders({ organizationId }: { organizationId: string }) {
  const { folders } = await apiClient<{ folders: AsDto<Folder>[] }>({
    path: `/api/organizations/${organizationId}/folders`,
    method: 'GET',
  });

  return {
    folders: folders.map(coerceDates),
  };
}

export async function fetchFolderContents({
  organizationId,
  folderId,
}: {
  organizationId: string;
  folderId?: string | null;
}) {
  const { folders, documents } = await apiClient<{
    folders: AsDto<Folder>[];
    documents: AsDto<Document>[];
  }>({
    path: `/api/organizations/${organizationId}/folders/contents`,
    method: 'GET',
    query: folderId ? { folderId } : undefined,
  });

  return {
    folders: folders.map(coerceDates),
    documents: documents.map(coerceDates),
  };
}

export async function fetchFolder({
  organizationId,
  folderId,
}: {
  organizationId: string;
  folderId: string;
}) {
  const { folder } = await apiClient<{ folder: AsDto<Folder> }>({
    path: `/api/organizations/${organizationId}/folders/${folderId}`,
    method: 'GET',
  });

  return {
    folder: coerceDates(folder),
  };
}

export async function createFolder({
  organizationId,
  name,
  parentId,
}: {
  organizationId: string;
  name: string;
  parentId?: string | null;
}) {
  const { folder } = await apiClient<{ folder: AsDto<Folder> }>({
    path: `/api/organizations/${organizationId}/folders`,
    method: 'POST',
    body: { name, parentId },
  });

  return {
    folder: coerceDates(folder),
  };
}

export async function updateFolder({
  organizationId,
  folderId,
  name,
  parentId,
}: {
  organizationId: string;
  folderId: string;
  name?: string;
  parentId?: string | null;
}) {
  const { folder } = await apiClient<{ folder: AsDto<Folder> }>({
    path: `/api/organizations/${organizationId}/folders/${folderId}`,
    method: 'PATCH',
    body: { name, parentId },
  });

  return {
    folder: coerceDates(folder),
  };
}

export async function deleteFolder({
  organizationId,
  folderId,
  force,
}: {
  organizationId: string;
  folderId: string;
  force?: boolean;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/folders/${folderId}`,
    method: 'DELETE',
    query: force ? { force: 'true' } : undefined,
  });
}
