import { createApiClient } from './http-client';
import { apiContracts } from '@papra/app-server/api/contract';

export const PAPRA_API_URL = 'https://api.papra.app';

export type Client = ReturnType<typeof createClient>;

export function createClient({
  apiKey,
  apiBaseUrl = PAPRA_API_URL,
}: {
  apiKey: string;
  apiBaseUrl?: string;
}) {
  const { apiClient } = createApiClient({ apiKey, apiBaseUrl });

  return {};
}
