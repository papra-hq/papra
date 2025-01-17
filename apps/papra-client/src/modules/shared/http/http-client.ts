import type { FetchOptions, ResponseType } from 'ofetch';
import { buildTimeConfig } from '@/modules/config/config';
import { demoHttpClient } from '@/modules/demo/demo-http-client';
import { ofetch } from 'ofetch';

export { ResponseType };
export type HttpClientOptions<R extends ResponseType = 'json'> = Omit<FetchOptions<R>, 'baseURL'> & { url: string; baseUrl?: string };

function baseHttpClient<A, R extends ResponseType = 'json'>({ url, baseUrl, ...rest }: HttpClientOptions<R>) {
  return ofetch<A, R>(url, {
    baseURL: baseUrl,
    ...rest,
  });
}

export const httpClient = buildTimeConfig.isDemoMode ? demoHttpClient : baseHttpClient;
