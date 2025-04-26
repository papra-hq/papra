import type { ApiKey } from './api-keys.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function createApiKey({
  name,
  permissions,
  organizationIds,
  allOrganizations,
  expiresAt,
}: {
  name: string;
  permissions: string[];
  organizationIds: string[];
  allOrganizations: boolean;
  expiresAt?: Date;
}) {
  const { apiKey, token } = await apiClient<{
    apiKey: ApiKey;
    token: string;
  }>({
    path: '/api/api-keys',
    method: 'POST',
    body: {
      name,
      permissions,
      organizationIds,
      allOrganizations,
      expiresAt,
    },
  });

  return {
    apiKey: coerceDates(apiKey),
    token,
  };
}

export async function fetchApiKeys() {
  const { apiKeys } = await apiClient<{
    apiKeys: ApiKey[];
  }>({
    path: '/api/api-keys',
  });

  return {
    apiKeys: apiKeys.map(coerceDates),
  };
}

export async function deleteApiKey({ apiKeyId }: { apiKeyId: string }) {
  await apiClient({
    path: `/api/api-keys/${apiKeyId}`,
    method: 'DELETE',
  });
}
