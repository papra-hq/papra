import type { ApiClient } from '../api/api.client';
import type { ServerConfig } from './config.types';
import { httpClient } from '../api/http.client';

export async function fetchServerConfig({ apiClient}: { apiClient: ApiClient }) {
  return apiClient<{
    config: ServerConfig;
  }>({
    path: '/api/config',
  });
}

export async function pingServer({ url}: { url: string }): Promise<true | never> {
  const response = await httpClient<{ status: 'ok' | 'error' }>({ url: `/api/ping`, baseUrl: url })
    .then(() => true)
    .catch(() => false);

  if (!response) {
    throw new Error('Could not reach the server');
  }

  return true;
}
