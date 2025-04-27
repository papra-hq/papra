import type { PapraDocument } from './api-client.types';
import type { ApiClient } from './http-client';
import { injectArguments } from '@corentinth/chisels';
import { createApiClient } from './http-client';

export const PAPRA_API_URL = 'https://api.papra.app';

export function createClient({ apiKey, apiBaseUrl = PAPRA_API_URL }: { apiKey: string; apiBaseUrl?: string }) {
  const { apiClient } = createApiClient({ apiKey, apiBaseUrl });

  const methods = injectArguments(
    {
      uploadDocument,
    },
    { apiClient },
  );

  return {
    ...methods,
    forOrganization: (organizationId: string) => injectArguments(methods, { organizationId }),
  };
}

async function uploadDocument({
  file,
  organizationId,
  apiClient,
}: { file: File; organizationId: string; apiClient: ApiClient }) {
  const formData = new FormData();
  formData.append('file', file);

  return await apiClient<{ document: PapraDocument }>(`/api/organizations/${organizationId}/documents`, {
    method: 'POST',
    body: formData,
  });
}
