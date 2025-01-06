import { authStore } from '@/modules/auth/auth.store';
import { config } from '@/modules/config/config';
import { safely } from '@corentinth/chisels';
import { buildAuthHeader, shouldRefreshAuthTokens } from './api-client.models';
import { httpClient, type HttpClientOptions, type ResponseType } from './http-client';

export async function apiClient<T, R extends ResponseType = 'json'>({
  path,
  ...rest
}: {
  path: string;
} & Omit<HttpClientOptions<R>, 'url'>) {
  const accessToken = authStore.getAccessToken();

  const requestConfig: HttpClientOptions<R> = {
    baseUrl: config.baseApiUrl,
    url: path,
    ...rest,
    headers: {
      ...buildAuthHeader({ accessToken }),
      ...rest.headers,
    },
  };

  const [response, error] = await safely(httpClient<T, R>(requestConfig));

  if (shouldRefreshAuthTokens({ error })) {
    return refreshTokensAndRetry<T, R>({ requestConfig });
  }

  if (error) {
    throw error;
  }

  return response;
}

async function refreshTokensAndRetry<T, R extends ResponseType = 'json'>({ requestConfig }: { requestConfig: HttpClientOptions<R> }) {
  try {
    // If a refresh token refresh request is already in progress, wait for it to finish
    if (authStore.getIsRefreshTokenInProgress()) {
      await authStore.waitForRefreshTokenToBeRefreshed();
    } else {
      await authStore.refreshToken();
    }

    const accessToken = authStore.getAccessToken();

    return httpClient<T, R>({
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        ...buildAuthHeader({ accessToken }),
      },
    });
  } catch (err) {
    await authStore.clearAccessToken();
    window.location.href = '/login';
    console.error('Refresh token expired or invalid', err);
    throw err;
  }
}
