import type { HttpClientOptions, ResponseType } from './http.client';
import { Platform } from 'react-native';
import { httpClient } from './http.client';
import { headersInitToObject } from './api.models';

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient({
  baseUrl,
  getAuthCookie,
  customHeaders = {},
}: {
  baseUrl: string;
  getAuthCookie: () => string;
  customHeaders?: Record<string, string>;
}) {
  return async <T, R extends ResponseType = 'json'>({
    path,
    ...rest
  }: { path: string } & Omit<HttpClientOptions<R>, 'url'>) => {
    return httpClient<T, R>({
      baseUrl,
      url: path,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        ...customHeaders,
        ...(Platform.OS === 'web'
          ? {}
          : {
              Cookie: getAuthCookie(),
            }),
        ...headersInitToObject(rest.headers),
      },
      ...rest,
    });
  };
}
