import { BlockList } from 'node:net';
import { describe, expect, test } from 'vitest';
import { isIpSsrfSafe } from './ssrf.models';

describe('ssrf', () => {
  describe('node:net BlockList', () => {
    test('the native BlockList automatically unwraps IPv4-mapped IPv6 addresses', () => {
      const blockList = new BlockList();

      blockList.addAddress('127.0.0.1');

      expect(blockList.check('127.0.0.1', 'ipv4')).toBe(true);
      expect(blockList.check('::ffff:127.0.0.1', 'ipv6')).toBe(true);
      expect(blockList.check('::ffff:7f00:1', 'ipv6')).toBe(true); // as hex

      expect(blockList.check('192.168.0.1', 'ipv4')).toBe(false);
      expect(blockList.check('::ffff:192.168.0.1', 'ipv6')).toBe(false);
      expect(blockList.check('::ffff:c0a8:0:1', 'ipv6')).toBe(false); // as hex
    });
  });

  describe('isIpSsrfSafe', () => {
    // IPv4 ranges

    test('0.0.0.0/8 "this" network addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('0.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('0.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('0.255.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('1.0.0.0')).toBe(true);
    });

    test('10.0.0.0/8 private addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('10.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('10.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('10.255.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('9.255.255.255')).toBe(true);
      expect(isIpSsrfSafe('11.0.0.0')).toBe(true);
    });

    test('100.64.0.0/10 carrier-grade NAT addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('100.64.0.0')).toBe(false);
      expect(isIpSsrfSafe('100.64.0.1')).toBe(false);
      expect(isIpSsrfSafe('100.127.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('100.63.255.255')).toBe(true);
      expect(isIpSsrfSafe('100.128.0.0')).toBe(true);
    });

    test('127.0.0.0/8 loopback addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('127.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('127.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('127.255.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('126.255.255.255')).toBe(true);
      expect(isIpSsrfSafe('128.0.0.0')).toBe(true);
    });

    test('169.254.0.0/16 link-local addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('169.254.0.0')).toBe(false);
      expect(isIpSsrfSafe('169.254.0.1')).toBe(false);
      expect(isIpSsrfSafe('169.254.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('169.253.255.255')).toBe(true);
      expect(isIpSsrfSafe('169.255.0.0')).toBe(true);
    });

    test('172.16.0.0/12 private addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('172.16.0.0')).toBe(false);
      expect(isIpSsrfSafe('172.16.0.1')).toBe(false);
      expect(isIpSsrfSafe('172.31.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('172.15.255.255')).toBe(true);
      expect(isIpSsrfSafe('172.32.0.0')).toBe(true);
    });

    test('192.0.0.0/24 IETF protocol assignment addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('192.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('192.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('192.0.0.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('192.0.1.0')).toBe(true);
    });

    test('192.0.2.0/24 documentation (TEST-NET-1) addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('192.0.2.0')).toBe(false);
      expect(isIpSsrfSafe('192.0.2.1')).toBe(false);
      expect(isIpSsrfSafe('192.0.2.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('192.0.1.255')).toBe(true);
      expect(isIpSsrfSafe('192.0.3.0')).toBe(true);
    });

    test('192.88.99.0/24 6to4 relay anycast addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('192.88.99.0')).toBe(false);
      expect(isIpSsrfSafe('192.88.99.1')).toBe(false);
      expect(isIpSsrfSafe('192.88.99.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('192.88.98.255')).toBe(true);
      expect(isIpSsrfSafe('192.88.100.0')).toBe(true);
    });

    test('192.168.0.0/16 private addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('192.168.0.0')).toBe(false);
      expect(isIpSsrfSafe('192.168.0.1')).toBe(false);
      expect(isIpSsrfSafe('192.168.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('192.167.255.255')).toBe(true);
      expect(isIpSsrfSafe('192.169.0.0')).toBe(true);
    });

    test('198.18.0.0/15 benchmarking addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('198.18.0.0')).toBe(false);
      expect(isIpSsrfSafe('198.18.0.1')).toBe(false);
      expect(isIpSsrfSafe('198.19.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('198.17.255.255')).toBe(true);
      expect(isIpSsrfSafe('198.20.0.0')).toBe(true);
    });

    test('198.51.100.0/24 documentation (TEST-NET-2) addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('198.51.100.0')).toBe(false);
      expect(isIpSsrfSafe('198.51.100.1')).toBe(false);
      expect(isIpSsrfSafe('198.51.100.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('198.51.99.255')).toBe(true);
      expect(isIpSsrfSafe('198.51.101.0')).toBe(true);
    });

    test('203.0.113.0/24 documentation (TEST-NET-3) addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('203.0.113.0')).toBe(false);
      expect(isIpSsrfSafe('203.0.113.1')).toBe(false);
      expect(isIpSsrfSafe('203.0.113.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('203.0.112.255')).toBe(true);
      expect(isIpSsrfSafe('203.0.114.0')).toBe(true);
    });

    test('224.0.0.0/4 multicast addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('224.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('224.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('239.255.255.255')).toBe(false);

      // limits
      expect(isIpSsrfSafe('223.255.255.255')).toBe(true);
    });

    test('240.0.0.0/4 reserved addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('240.0.0.0')).toBe(false);
      expect(isIpSsrfSafe('240.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('255.255.255.254')).toBe(false);
    });

    test('255.255.255.255 broadcast address is not SSRF safe', () => {
      expect(isIpSsrfSafe('255.255.255.255')).toBe(false);
    });

    test('public IPv4 addresses are SSRF safe', () => {
      expect(isIpSsrfSafe('8.8.8.8')).toBe(true);
      expect(isIpSsrfSafe('1.1.1.1')).toBe(true);
      expect(isIpSsrfSafe('93.184.216.34')).toBe(true);
      expect(isIpSsrfSafe('151.101.1.67')).toBe(true);
    });

    // IPv6 ranges

    test(':: unspecified address is not SSRF safe', () => {
      expect(isIpSsrfSafe('::')).toBe(false);
    });

    test('::1 loopback address is not SSRF safe', () => {
      expect(isIpSsrfSafe('::1')).toBe(false);
    });

    test('::ffff:0:0/96 IPv4-mapped IPv6 addresses inherit the safety of their embedded IPv4 address', () => {
      // dotted-decimal notation: mapped private/reserved IPv4 → not safe
      expect(isIpSsrfSafe('::ffff:127.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('::ffff:10.0.0.1')).toBe(false);
      expect(isIpSsrfSafe('::ffff:192.168.1.1')).toBe(false);
      expect(isIpSsrfSafe('::ffff:169.254.1.1')).toBe(false);
      expect(isIpSsrfSafe('::ffff:172.16.0.1')).toBe(false);

      // hex notation: ::ffff:7f00:1 = 127.0.0.1 → not safe
      expect(isIpSsrfSafe('::ffff:7f00:1')).toBe(false);
      // hex notation: ::ffff:0a00:1 = 10.0.0.1 → not safe
      expect(isIpSsrfSafe('::ffff:0a00:1')).toBe(false);

      // dotted-decimal notation: mapped public IPv4 → safe
      expect(isIpSsrfSafe('::ffff:8.8.8.8')).toBe(true);
      expect(isIpSsrfSafe('::ffff:93.184.216.34')).toBe(true);

      // hex notation: ::ffff:0808:0808 = 8.8.8.8 → safe
      expect(isIpSsrfSafe('::ffff:808:808')).toBe(true);
    });

    test('64:ff9b::/96 NAT64 well-known prefix addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('64:ff9b::')).toBe(false);
      expect(isIpSsrfSafe('64:ff9b::1')).toBe(false);
      expect(isIpSsrfSafe('64:ff9b::ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('64:ff9a:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    });

    test('64:ff9b:1::/48 NAT64 local-use prefix addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('64:ff9b:1::')).toBe(false);
      expect(isIpSsrfSafe('64:ff9b:1::1')).toBe(false);
      expect(isIpSsrfSafe('64:ff9b:1:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('64:ff9b:0:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('64:ff9b:2::')).toBe(true);
    });

    test('2001::/32 Teredo tunneling addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('2001::')).toBe(false);
      expect(isIpSsrfSafe('2001::1')).toBe(false);
      expect(isIpSsrfSafe('2001:0:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('2001:1::')).toBe(true);
    });

    test('2002::/16 6to4 addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('2002::')).toBe(false);
      expect(isIpSsrfSafe('2002::1')).toBe(false);
      expect(isIpSsrfSafe('2002:7f00:1::')).toBe(false); // embeds 127.0.0.1
      expect(isIpSsrfSafe('2002:c0a8:101::')).toBe(false); // embeds 192.168.1.1
      expect(isIpSsrfSafe('2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('2001:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('2003::')).toBe(true);
    });

    test('100::/64 discard prefix addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('100::')).toBe(false);
      expect(isIpSsrfSafe('100::1')).toBe(false);
      expect(isIpSsrfSafe('100::ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('100:0:0:1::')).toBe(true);
    });

    test('2001:10::/28 ORCHID addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('2001:10::')).toBe(false);
      expect(isIpSsrfSafe('2001:10::1')).toBe(false);
      expect(isIpSsrfSafe('2001:1f:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('2001:f:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    });

    test('2001:20::/28 ORCHIDv2 addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('2001:20::')).toBe(false);
      expect(isIpSsrfSafe('2001:20::1')).toBe(false);
      expect(isIpSsrfSafe('2001:2f:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('2001:30::')).toBe(true);
    });

    test('2001:db8::/32 documentation addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('2001:db8::')).toBe(false);
      expect(isIpSsrfSafe('2001:db8::1')).toBe(false);
      expect(isIpSsrfSafe('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('2001:db7:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('2001:db9::')).toBe(true);
    });

    test('fc00::/7 unique local addresses (ULA) are not SSRF safe', () => {
      expect(isIpSsrfSafe('fc00::')).toBe(false);
      expect(isIpSsrfSafe('fc00::1')).toBe(false);
      expect(isIpSsrfSafe('fd00::')).toBe(false);
      expect(isIpSsrfSafe('fd12:3456:789a::1')).toBe(false);
      expect(isIpSsrfSafe('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('fe00::')).toBe(true);
    });

    test('fe80::/10 link-local addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('fe80::')).toBe(false);
      expect(isIpSsrfSafe('fe80::1')).toBe(false);
      expect(isIpSsrfSafe('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('fe7f:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('fec0::')).toBe(true);
    });

    test('ff00::/8 multicast addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('ff00::')).toBe(false);
      expect(isIpSsrfSafe('ff02::1')).toBe(false);
      expect(isIpSsrfSafe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('feff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    });

    test('3fff::/20 documentation addresses (RFC 9637) are not SSRF safe', () => {
      expect(isIpSsrfSafe('3fff::')).toBe(false);
      expect(isIpSsrfSafe('3fff::1')).toBe(false);
      expect(isIpSsrfSafe('3fff:0fff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('3ffe:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('3fff:1000::')).toBe(true);
    });

    test('5f00::/16 IPv6 Segment Routing (SRv6) addresses are not SSRF safe', () => {
      expect(isIpSsrfSafe('5f00::')).toBe(false);
      expect(isIpSsrfSafe('5f00::1')).toBe(false);
      expect(isIpSsrfSafe('5f00:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);

      // limits
      expect(isIpSsrfSafe('5eff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      expect(isIpSsrfSafe('6000::')).toBe(true);
    });

    test('public IPv6 addresses are SSRF safe', () => {
      expect(isIpSsrfSafe('2600:1901:0:38d7::')).toBe(true);
      expect(isIpSsrfSafe('2607:f8b0:4004:800::200e')).toBe(true);
      expect(isIpSsrfSafe('2606:4700:4700::1111')).toBe(true);
    });
  });
});
