import type { $Fetch } from 'ofetch';
import { ofetch } from 'ofetch';
import { version } from '../package.json';

export type ApiClient = $Fetch;

export type HttpClientOptions = {
  apiKey?: string;
  apiBaseUrl: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  fetch?: typeof globalThis.fetch;
};

export function createApiClient({
  apiKey,
  apiBaseUrl,
  headers: customHeaders,
  credentials,
  fetch: fetchImplementation,
}: HttpClientOptions): { apiClient: ApiClient } {
  const headers = new Headers(customHeaders);
  headers.set('X-Papra-Source', `papra-api-sdk-javascript/${version}`);

  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  const apiClient = ofetch.create(
    { headers, baseURL: apiBaseUrl, credentials },
    { fetch: fetchImplementation },
  );

  return {
    apiClient,
  };
}
