import type { HttpClientOptions, ResponseType } from './http-client';
import { buildTimeConfig } from '@/modules/config/config';
import { safely } from '@corentinth/chisels';
import { httpClient } from './http-client';
import { isHttpErrorWithStatusCode } from './http-errors';

export async function apiClient<T, R extends ResponseType = 'json'>({
  path,
  ...rest
}: {
  path: string;
} & Omit<HttpClientOptions<R>, 'url'>) {
  const requestConfig: HttpClientOptions<R> = {
    baseUrl: buildTimeConfig.baseApiUrl,
    url: path,
    credentials: 'include',
    ...rest,
  };

  const [response, error] = await safely(httpClient<T, R>(requestConfig));

  if (isHttpErrorWithStatusCode({ error, statusCode: 401 })) {
    window.location.href = '/login';
  }

  if (error) {
    throw error;
  }

  return response;
}
