import type { FetchOptions } from 'ofetch';
import { FetchError, ofetch, ResponseType } from 'ofetch';

export { ResponseType };
export type HttpClientOptions<R extends ResponseType = 'json'> = Omit<FetchOptions<R>, 'baseURL'> & { url: string; baseUrl?: string };

export async function httpClient<A, R extends ResponseType = 'json'>({ url, baseUrl, ...rest }: HttpClientOptions<R>) {
  return ofetch<A, R>(url, {
    baseURL: baseUrl,
    ...rest,
  });
}

export function isHttpClientError(error: unknown): error is FetchError {
  return error instanceof FetchError;
}
