import type { $Fetch } from 'ofetch';
import { ofetch } from 'ofetch';
import { version } from '../package.json';

export type ApiClient = $Fetch;

export function createApiClient({ apiKey, apiBaseUrl }: { apiKey: string; apiBaseUrl: string }): { apiClient: ApiClient } {
  const apiClient = ofetch.create({
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-Papra-Source': `papra-api-sdk-javascript/${version}`,
    },
    baseURL: apiBaseUrl,
  });

  return {
    apiClient,
  };
}
