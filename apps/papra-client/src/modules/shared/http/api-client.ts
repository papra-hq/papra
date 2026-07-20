import type { HttpClientOptions, ResponseType } from './http-client';
import { safely } from '@corentinth/chisels';
import { buildTimeConfig } from '@/modules/config/config';
import { httpClient } from './http-client';
import { isHttpErrorWithStatusCode } from './http-errors';
import { buildPathWithRedirect } from '@/modules/navigation/redirect';
import { authPagesPaths } from '@/modules/auth/auth.constants';

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
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    window.location.href = buildPathWithRedirect({
      path: authPagesPaths.login,
      redirectPath: currentPath,
    });
  }

  if (error) {
    throw error;
  }

  return response;
}
