import type { AsDto } from '../shared/http/http-client.types';
import type { DocumentView } from './document-views.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchDocumentViews({ organizationId }: { organizationId: string }) {
  const { documentViews } = await apiClient<{ documentViews: AsDto<DocumentView>[] }>({
    path: `/api/organizations/${organizationId}/document-views`,
    method: 'GET',
  });

  return { documentViews: documentViews.map(coerceDates) };
}

export async function fetchDocumentView({
  organizationId,
  documentViewId,
}: {
  organizationId: string;
  documentViewId: string;
}) {
  const { documentViews } = await fetchDocumentViews({ organizationId });
  const documentView = documentViews.find((d) => d.id === documentViewId);
  return { documentView };
}

export async function createDocumentView({
  organizationId,
  name,
  query,
  description,
}: {
  organizationId: string;
  name: string;
  query: string;
  description?: string | null;
}) {
  const { documentView } = await apiClient<{ documentView: AsDto<DocumentView> }>({
    path: `/api/organizations/${organizationId}/document-views`,
    method: 'POST',
    body: { name, query, description },
  });

  return { documentView: coerceDates(documentView) };
}

export async function updateDocumentView({
  organizationId,
  documentViewId,
  name,
  query,
  description,
}: {
  organizationId: string;
  documentViewId: string;
  name?: string;
  query?: string;
  description?: string | null;
}) {
  const { documentView } = await apiClient<{ documentView: AsDto<DocumentView> }>({
    path: `/api/organizations/${organizationId}/document-views/${documentViewId}`,
    method: 'PUT',
    body: { name, query, description },
  });

  return { documentView: coerceDates(documentView) };
}

export async function deleteDocumentView({
  organizationId,
  documentViewId,
}: {
  organizationId: string;
  documentViewId: string;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/document-views/${documentViewId}`,
    method: 'DELETE',
  });
}
