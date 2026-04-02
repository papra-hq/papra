import type { Logger } from '@crowlog/logger';
import { isIP } from 'node:net';
import { dnsLookupHostname } from '../dns/dns.services';
import { createLogger } from '../logger/logger';
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
  try {
    const { hostname } = new URL(url);

    if (allowedHostnames && allowedHostnames.has(hostname)) {
      return true;
    }

    const maybeIpTypeNumber = isIP(hostname);

    const { addresses } = maybeIpTypeNumber
      ? { addresses: [{ address: hostname, family: maybeIpTypeNumber }] }
      : await dnsLookup({ hostname });

    return addresses.length > 0 && addresses.every(({ address }) => isIpSsrfSafe(address));
  } catch (error) {
    logger.error({ error, url }, 'Error while checking if URL is SSRF safe');
    return false;
  }
}
