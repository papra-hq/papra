/* eslint-disable no-console */
import type { MappedResponseType } from 'ofetch';
import type { HttpClientOptions, ResponseType } from '../shared/http/http-client';
import { joinUrlPaths } from '@corentinth/chisels';
import { router } from './demo-api-mock';

export async function demoHttpClient<A, R extends ResponseType = 'json'>(options: HttpClientOptions<R>): Promise<MappedResponseType<R, A>> {
  const path = `/${joinUrlPaths(options.method ?? 'GET', options.url)}`;
  const matchedRoute = router.lookup(path);

  if (!matchedRoute) {
    console.warn(`[demo] No route found for ${options.method} ${options.url}`);
    return {} as any;
  }

  const params = matchedRoute.params;

  const data = await matchedRoute.handler({ params, ...options });

  console.log(`[demo] ${options.method} ${options.url} `, data);

  return data;
}
