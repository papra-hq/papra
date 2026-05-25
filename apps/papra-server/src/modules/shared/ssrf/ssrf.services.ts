import type { Logger } from '@crowlog/logger';
import { isIP } from 'node:net';
import { dnsLookupHostname } from '../dns/dns.services';
import { createLogger } from '../logger/logger';
import { getUrlHostname } from '../urls/urls.models';
import { isNil } from '../utils';
import { isIpSsrfSafe } from './ssrf.models';

export async function isUrlSsrfSafe({
  url,
  allowedHostnames,
  dnsLookup = dnsLookupHostname,
  logger = createLogger({ namespace: 'ssrf.services' }),
}: {
  url: string;
  allowedHostnames?: Set<string>;
  dnsLookup?: (args: { hostname: string }) => Promise<{ addresses: { address: string; family: number }[] }>;
  logger?: Logger;
}): Promise<boolean> {
  const hostname = getUrlHostname(url);

  if (isNil(hostname)) {
    logger.error({ url }, 'Invalid URL provided, cannot extract hostname');
    return false;
  }

  return isHostnameSsrfSafe({ hostname, allowedHostnames, dnsLookup, logger });
}

async function isHostnameSsrfSafe({
  hostname,
  allowedHostnames,
  dnsLookup = dnsLookupHostname,
  logger = createLogger({ namespace: 'ssrf.services' }),
}: {
  hostname: string;
  allowedHostnames?: Set<string>;
  dnsLookup?: (args: { hostname: string }) => Promise<{ addresses: { address: string; family: number }[] }>;
  logger?: Logger;
}): Promise<boolean> {
  try {
    if (allowedHostnames && allowedHostnames.has(hostname)) {
      return true;
    }

    const maybeIpTypeNumber = isIP(hostname);

    const { addresses } = maybeIpTypeNumber
      ? { addresses: [{ address: hostname, family: maybeIpTypeNumber }] }
      : await dnsLookup({ hostname });

    return addresses.length > 0 && addresses.every(({ address }) => isIpSsrfSafe(address));
  } catch (error) {
    logger.error({ error, hostname }, 'Error while checking if hostname is SSRF safe');
    return false;
  }
}

export function createCachedIsUrlSsrfSafeFunction({
  allowedHostnames,
  dnsLookup,
  logger = createLogger({ namespace: 'ssrf.services' }),
}: {
  allowedHostnames?: Set<string>;
  dnsLookup?: (args: { hostname: string }) => Promise<{ addresses: { address: string; family: number }[] }>;
  logger?: Logger;
}) {
  const hostnameCache = new Map<string, boolean>();

  return async ({ url }: { url: string }) => {
    const hostname = getUrlHostname(url);

    if (isNil(hostname)) {
      logger.error({ url }, 'Invalid URL provided, cannot extract hostname');
      return false;
    }

    const cachedResult = hostnameCache.get(hostname);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const isSafe = await isHostnameSsrfSafe({ hostname, allowedHostnames, dnsLookup, logger });

    hostnameCache.set(hostname, isSafe);

    return isSafe;
  };
}
