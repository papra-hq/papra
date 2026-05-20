import type { AsDto } from '../shared/http/http-client.types';
import type { View } from './views.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchViews({ organizationId }: { organizationId: string }) {
  const { views } = await apiClient<{ views: AsDto<View>[] }>({
    path: `/api/organizations/${organizationId}/views`,
    method: 'GET',
  });

  return { views: views.map(coerceDates) };
}

export async function fetchView({ organizationId, viewId }: { organizationId: string; viewId: string }) {
  const { views } = await fetchViews({ organizationId });
  const view = views.find(v => v.id === viewId);
  return { view };
}

export async function createView({ organizationId, name, query }: { organizationId: string; name: string; query: string }) {
  const { view } = await apiClient<{ view: AsDto<View> }>({
    path: `/api/organizations/${organizationId}/views`,
    method: 'POST',
    body: { name, query },
  });

  return { view: coerceDates(view) };
}

export async function updateView({ organizationId, viewId, name, query }: { organizationId: string; viewId: string; name?: string; query?: string }) {
  const { view } = await apiClient<{ view: AsDto<View> }>({
    path: `/api/organizations/${organizationId}/views/${viewId}`,
    method: 'PUT',
    body: { name, query },
  });

  return { view: coerceDates(view) };
}

export async function deleteView({ organizationId, viewId }: { organizationId: string; viewId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/views/${viewId}`,
    method: 'DELETE',
  });
}
