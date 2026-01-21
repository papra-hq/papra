import type { FetchOptions, ResponseType } from 'ofetch';
import { ofetch } from 'ofetch';
import { isDemoMode } from '@/modules/config/config';

export { ResponseType };
export type HttpClientOptions<R extends ResponseType = 'json'> = Omit<FetchOptions<R>, 'baseURL'> & { url: string; baseUrl?: string };

function baseHttpClient<A, R extends ResponseType = 'json'>({ url, baseUrl, ...rest }: HttpClientOptions<R>) {
  return ofetch<A, R>(url, {
    baseURL: baseUrl,
    ...rest,
  });
}

export async function httpClient<A, R extends ResponseType = 'json'>(options: HttpClientOptions<R>) {
  if (isDemoMode) {
    const { demoHttpClient } = await import('@/modules/demo/demo-http-client');
    return demoHttpClient<A, R>(options);
  }

  return baseHttpClient<A, R>(options);
}
