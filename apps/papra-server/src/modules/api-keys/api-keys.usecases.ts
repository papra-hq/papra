import type { ApiKeysRepository } from './api-keys.repository';
import type { ApiKeyPermissions } from './api-keys.types';
import { getApiKeyHash, getApiKeyUiPrefix } from './api-keys.models';
import { generateApiToken as generateApiTokenImpl } from './api-keys.services';

export async function createApiKey({
  name,
  userId,
  permissions,
  organizationIds,
  allOrganizations,
  expiresAt,
  apiKeyRepository,
  generateApiToken = generateApiTokenImpl,
}: {
  name: string;
  userId: string;
  permissions: ApiKeyPermissions[];
  organizationIds: string[];
  allOrganizations: boolean;
  expiresAt?: Date;
  apiKeyRepository: ApiKeysRepository;
  generateApiToken?: () => { token: string };
}) {
  const { token } = generateApiToken();

  const { prefix } = getApiKeyUiPrefix({ token });
  const { keyHash } = getApiKeyHash({ token });

  const { apiKey } = await apiKeyRepository.saveApiKey({
    name,
    permissions,
    keyHash,
    organizationIds,
    allOrganizations,
    expiresAt,
    userId,
    prefix,
  });

  return {
    apiKey,
    token,
  };
}

export async function getApiKey({ token, apiKeyRepository }: { token: string; apiKeyRepository: ApiKeysRepository }) {
  const { keyHash } = getApiKeyHash({ token });

  const apiKey = await apiKeyRepository.getApiKeyByHash({ keyHash });

  return apiKey;
}
