import { lookup } from 'node:dns/promises';

export async function dnsLookupHostname({ hostname }: { hostname: string }): Promise<{ addresses: { address: string; family: number }[] }> {
  const addresses = await lookup(hostname, { all: true });

  return {
    addresses,
  };
}
