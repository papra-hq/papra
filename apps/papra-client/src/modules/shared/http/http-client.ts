import type { FetchOptions, ResponseType } from 'ofetch';
import { ofetch } from 'ofetch';
import { buildTimeConfig } from '@/modules/config/config';

export { ResponseType };
export type HttpClientOptions<R extends ResponseType = 'json'> = Omit<FetchOptions<R>, 'baseURL'> & { url: string; baseUrl?: string };

function baseHttpClient<A, R extends ResponseType = 'json'>({ url, baseUrl, ...rest }: HttpClientOptions<R>) {
  return ofetch<A, R>(url, {
    baseURL: baseUrl,
    ...rest,
  });
}

// eslint-disable-next-line antfu/no-top-level-await
export const httpClient = buildTimeConfig.isDemoMode ? await import('@/modules/demo/demo-http-client').then(m => m.demoHttpClient) : baseHttpClient;
