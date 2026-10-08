import type { HttpClientOptions } from './http-client';
import { apiContracts } from '@papra/app-server/api/contract';
import { createContractClient } from './contract-client';
import { createApiClient } from './http-client';
import { createLegacyClient } from './legacy-client';

export const PAPRA_API_URL = 'https://api.papra.app';

export type Client = ReturnType<typeof createClient>;

export type ClientOptions = Omit<HttpClientOptions, 'apiBaseUrl'> & { apiBaseUrl?: string };

export function createClient({ apiBaseUrl = PAPRA_API_URL, ...options }: ClientOptions = {}) {
  const { apiClient } = createApiClient({ ...options, apiBaseUrl });

  return {
    ...createLegacyClient({ apiClient }),
    ...createContractClient({ contracts: apiContracts, apiClient }),
  };
}
