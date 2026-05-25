import { BlockList, isIP } from 'node:net';

function createSsrfBlockList(): BlockList {
  const ssrfBlockList = new BlockList();

  // IPv4 reserved ranges (https://en.wikipedia.org/wiki/Reserved_IP_addresses)
  ssrfBlockList.addSubnet('127.0.0.0', 8, 'ipv4'); // Loopback
  ssrfBlockList.addSubnet('0.0.0.0', 8, 'ipv4'); // "This" network
  ssrfBlockList.addSubnet('10.0.0.0', 8, 'ipv4'); // Private network
  ssrfBlockList.addSubnet('100.64.0.0', 10, 'ipv4'); // Carrier-grade NAT
  ssrfBlockList.addSubnet('169.254.0.0', 16, 'ipv4'); // Link-local
  ssrfBlockList.addSubnet('172.16.0.0', 12, 'ipv4'); // Private network
  ssrfBlockList.addSubnet('192.0.0.0', 24, 'ipv4'); // IETF protocol assignment
  ssrfBlockList.addSubnet('192.0.2.0', 24, 'ipv4'); // Documentation (TEST-NET-1)
  ssrfBlockList.addSubnet('192.88.99.0', 24, 'ipv4'); // 6to4 relay anycast
  ssrfBlockList.addSubnet('192.168.0.0', 16, 'ipv4'); // Private network
  ssrfBlockList.addSubnet('198.18.0.0', 15, 'ipv4'); // Benchmarking
  ssrfBlockList.addSubnet('198.51.100.0', 24, 'ipv4'); // Documentation (TEST-NET-2)
  ssrfBlockList.addSubnet('203.0.113.0', 24, 'ipv4'); // Documentation (TEST-NET-3)
  ssrfBlockList.addSubnet('224.0.0.0', 4, 'ipv4'); // Multicast
  ssrfBlockList.addSubnet('233.252.0.0', 24, 'ipv4'); // Documentation (MCAST-TEST-NET)
  ssrfBlockList.addSubnet('240.0.0.0', 4, 'ipv4'); // Reserved
  ssrfBlockList.addSubnet('255.255.255.255', 32, 'ipv4'); // Broadcast

  ssrfBlockList.addAddress('::', 'ipv6'); // Unspecified
  ssrfBlockList.addAddress('::1', 'ipv6'); // Loopback
  ssrfBlockList.addSubnet('fc00::', 7, 'ipv6'); // Unique local address
  ssrfBlockList.addSubnet('fe80::', 10, 'ipv6'); // Link-local
  ssrfBlockList.addSubnet('ff00::', 8, 'ipv6'); // Multicast
  ssrfBlockList.addSubnet('2001:db8::', 32, 'ipv6'); // Documentation
  ssrfBlockList.addSubnet('2001:10::', 28, 'ipv6'); // ORCHID
  ssrfBlockList.addSubnet('2001:20::', 28, 'ipv6'); // ORCHIDv2
  ssrfBlockList.addSubnet('100::', 64, 'ipv6'); // Discard prefix
  ssrfBlockList.addSubnet('64:ff9b::', 96, 'ipv6'); // IPv4/IPv6 translation (well-known prefix)
  ssrfBlockList.addSubnet('64:ff9b:1::', 48, 'ipv6'); // IPv4/IPv6 translation (local-use, RFC 8215)
  ssrfBlockList.addSubnet('2001::', 32, 'ipv6'); // Teredo tunneling
  ssrfBlockList.addSubnet('2002::', 16, 'ipv6'); // 6to4 addresses
  ssrfBlockList.addSubnet('3fff::', 20, 'ipv6'); // Documentation (RFC 9637)
  ssrfBlockList.addSubnet('5f00::', 16, 'ipv6'); // IPv6 Segment Routing (SRv6)

  return ssrfBlockList;
}

export const ssrfBlockList = createSsrfBlockList();

export function isIpSsrfSafe(ip: string): boolean {
  const ipTypeNumber = isIP(ip);

  if (ipTypeNumber === 0) {
    throw new Error(`Invalid IP address: ${ip}`);
  }

  return !ssrfBlockList.check(ip, ipTypeNumber === 4 ? 'ipv4' : 'ipv6');
}
