import type { ApiClient } from '../api/api.client';
import { httpClient } from '../api/http.client';

export async function fetchServerConfig({ apiClient}: { apiClient: ApiClient }) {
  return apiClient<{
    config: {
      auth: {
        isEmailVerificationRequired: boolean;
        isPasswordResetEnabled: boolean;
        isRegistrationEnabled: boolean;
        showLegalLinksOnAuthPage: boolean;
        providers: {
          email: {
            isEnabled: boolean;
          };
          github: {
            isEnabled: boolean;
          };
          google: {
            isEnabled: boolean;
          };
          customs: {
            providerId: string;
            providerName: string;
          }[];
        };
      };
    };
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
