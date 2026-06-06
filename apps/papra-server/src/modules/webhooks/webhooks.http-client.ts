import type { WebhookHttpClient } from '@papra/webhooks';
import type { BlockList } from 'node:net';
import { ofetch } from 'ofetch';
import { Agent } from 'undici';
import { ssrfBlockList } from '../shared/ssrf/ssrf.models';
import { getUrlHostname } from '../shared/urls/urls.models';

export function createWebhookHttpClient({
  isSsrfProtectionEnabled,
  allowedHostnames,
  blockList = ssrfBlockList,
}: {
  isSsrfProtectionEnabled: boolean;
  allowedHostnames: Set<string>;
  blockList?: BlockList;
}): WebhookHttpClient {
  const ssrfSafeAgent = isSsrfProtectionEnabled
    ? new Agent({ connect: { blockList } })
    : undefined;

  return async ({ url, ...options }) => {
    const hostname = getUrlHostname(url);
    const isAllowlisted = hostname !== null && allowedHostnames.has(hostname);
    const dispatcher = isAllowlisted ? undefined : ssrfSafeAgent;

    const response = await ofetch.raw<unknown>(url, {
      ...options,
      // @ts-expect-error ofetch resolves undici types from the root install (pulled in by some transitive dep) which may differ from the server's direct undici dep. Runtime is compatible.
      dispatcher,
      ignoreResponseError: true,
      redirect: 'manual', // don't follow redirects, just return the 3xx response
    });

    return {
      responseStatus: response.status,
      responseData: response._data,
    };
  };
}

export function isSsrfBlockedError(error: unknown): boolean {
  if (!Error.isError(error)) {
    return false;
  }

  if ('code' in error && error.code === 'ERR_IP_BLOCKED') {
    return true;
  }

  // check if error is an AggregateError containing ssrf blocked errors
  if (error instanceof AggregateError) {
    return error.errors.some(isSsrfBlockedError);
  }

  // check if error has a cause that is an ssrf blocked error
  if ('cause' in error) {
    return isSsrfBlockedError(error.cause);
  }

  return false;
}
