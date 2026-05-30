import type { PublicSharedDocument, ShareLink } from './document-share-links.types';
import { buildTimeConfig } from '@/modules/config/config';
import { apiClient } from '../shared/http/api-client';
import { httpClient } from '../shared/http/http-client';

// Wire shape returned by the server: dates are ISO strings (or null).
type ShareLinkDto = {
  id: string;
  documentId: string;
  organizationId: string;
  token: string;
  url: string;
  isPasswordProtected: boolean;
  isEnabled: boolean;
  expiresAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  documentName?: string;
  isDocumentDeleted?: boolean;
};

function toShareLink(dto: ShareLinkDto): ShareLink {
  const toDate = (value: string | null) => (value ? new Date(value) : undefined);

  return {
    ...dto,
    expiresAt: toDate(dto.expiresAt),
    lastAccessedAt: toDate(dto.lastAccessedAt),
    createdAt: toDate(dto.createdAt),
    updatedAt: toDate(dto.updatedAt),
  };
}

export async function createShareLink({
  organizationId,
  documentId,
  expiresAt,
  password,
}: {
  organizationId: string;
  documentId: string;
  expiresAt?: Date | null;
  password?: string;
}) {
  const { shareLink } = await apiClient<{ shareLink: ShareLinkDto }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/documents/${documentId}/share-links`,
    body: { expiresAt: expiresAt ?? null, password },
  });

  return { shareLink: toShareLink(shareLink) };
}

export async function fetchDocumentShareLinks({ organizationId, documentId }: { organizationId: string; documentId: string }) {
  const { shareLinks } = await apiClient<{ shareLinks: ShareLinkDto[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/documents/${documentId}/share-links`,
  });

  return { shareLinks: shareLinks.map(toShareLink) };
}

export async function fetchOrganizationShareLinks({ organizationId }: { organizationId: string }) {
  const { shareLinks } = await apiClient<{ shareLinks: ShareLinkDto[] }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/share-links`,
  });

  return { shareLinks: shareLinks.map(toShareLink) };
}

export async function updateShareLink({
  organizationId,
  shareLinkId,
  expiresAt,
  password,
  isEnabled,
}: {
  organizationId: string;
  shareLinkId: string;
  expiresAt?: Date | null;
  password?: string | null;
  isEnabled?: boolean;
}) {
  const { shareLink } = await apiClient<{ shareLink: ShareLinkDto }>({
    method: 'PATCH',
    path: `/api/organizations/${organizationId}/share-links/${shareLinkId}`,
    body: { expiresAt, password, isEnabled },
  });

  return { shareLink: toShareLink(shareLink) };
}

export async function deleteShareLink({ organizationId, shareLinkId }: { organizationId: string; shareLinkId: string }) {
  await apiClient({
    method: 'DELETE',
    path: `/api/organizations/${organizationId}/share-links/${shareLinkId}`,
  });
}

// - Public endpoints
// These intentionally use the lower-level `httpClient` instead of `apiClient`: `apiClient` redirects to /login on any 401,
// but the public share flow uses 401 to signal "password required", which must be handled in-page.

function getAuthorizationHeaders({ accessToken }: { accessToken?: string }): Record<string, string> {
  return accessToken === undefined ? {} : { Authorization: `Bearer ${accessToken}` };
}

export async function fetchSharedDocument({ token, accessToken }: { token: string; accessToken?: string }) {
  const { document } = await httpClient<{ document: PublicSharedDocument }>({
    method: 'GET',
    baseUrl: buildTimeConfig.baseApiUrl,
    url: `/api/share-links/${token}/document`,
    headers: getAuthorizationHeaders({ accessToken }),
  });

  return { document };
}

export async function verifySharePassword({ token, password }: { token: string; password: string }) {
  const { accessToken } = await httpClient<{ accessToken: string }>({
    method: 'POST',
    baseUrl: buildTimeConfig.baseApiUrl,
    url: `/api/share-links/${token}/verify`,
    body: { password },
  });

  return { accessToken };
}

export async function fetchSharedDocumentFile({ token, accessToken }: { token: string; accessToken?: string }) {
  const blob = await httpClient<Blob, 'blob'>({
    method: 'GET',
    baseUrl: buildTimeConfig.baseApiUrl,
    url: `/api/share-links/${token}/document/file`,
    responseType: 'blob',
    headers: getAuthorizationHeaders({ accessToken }),
  });

  return { blob };
}
