import { authStore } from '@/modules/auth/auth.store';
import { config } from '@/modules/config/config';
import { buildUrl } from '@corentinth/chisels';
import { mapValues } from 'lodash-es';
import { buildAuthHeader, buildImpersonationHeader, getBody, getFormData } from './http-client.models';

export { apiClient };

async function apiClient<T>({
  path,
  method,
  body,
  formData,
  queryParams,
  impersonatedUserId,
}: {
  path: string;
  method: string;
  body?: unknown;
  formData?: Record<string, unknown>;
  queryParams?: Record<string, string | number>;
  impersonatedUserId?: string;
}): Promise<T> {
  const url = buildUrl({
    path,
    baseUrl: config.baseApiUrl,
    queryParams: queryParams ? mapValues(queryParams, String) : undefined,
  });

  const accessToken = authStore.getAccessToken();

  const fetchOptions = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...buildAuthHeader({ accessToken }),
      ...buildImpersonationHeader({ impersonatedUserId }),
    },
    body: body ? JSON.stringify(body) : formData ? getFormData(formData) : undefined,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    if (response.status === 401) {
      return refreshTokensAndRetry<T>({ originalOptions: fetchOptions, url });
    }

    const error = new Error(response.statusText);
    Object.assign(error, {
      status: response.status,
      body: await getBody({ response }),
    });

    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

async function refreshTokensAndRetry<T>({ originalOptions, url }: { originalOptions: RequestInit; url: string }): Promise<T> {
  try {
    if (authStore.getIsRefreshTokenInProgress()) {
      await authStore.waitForRefreshTokenToBeRefreshed();
    } else {
      await authStore.refreshToken();
    }

    const accessToken = authStore.getAccessToken();

    const response = await fetch(url, {
      ...originalOptions,
      headers: {
        ...originalOptions.headers,
        ...buildAuthHeader({ accessToken }),
      },
    });

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err) {
    await authStore.clearAccessToken();
    window.location.href = '/login';
    console.error('Refresh token expired or invalid', err);
    throw err;
  }
}
