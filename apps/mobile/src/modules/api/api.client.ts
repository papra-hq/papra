import type { HttpClientOptions, ResponseType } from './http.client';
import { Platform } from 'react-native';
import { httpClient } from './http.client';

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient({
  baseUrl,
  getAuthCookie,
}: {
  baseUrl: string;
  getAuthCookie: () => string;
}) {
  return async <T, R extends ResponseType = 'json'>({ path, ...rest}: { path: string } & Omit<HttpClientOptions<R>, 'url'>) => {
    return httpClient<T, R>({
      baseUrl,
      url: path,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        ...(Platform.OS === 'web'
          ? {}
          : {
              Cookie: getAuthCookie(),
            }),
        ...rest.headers,
      },
      ...rest,
    });
  };
}
