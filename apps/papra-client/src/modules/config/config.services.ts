import type { RuntimePublicConfig } from './config';
import { apiClient } from '../shared/http/api-client';

export async function fetchPublicConfig() {
  const { config } = await apiClient<{ config: RuntimePublicConfig }>({
    path: '/api/config',
    method: 'GET',
  });

  return { config };
}
