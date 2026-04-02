import { describe, expect, test } from 'vitest';
import { createTestLogger } from '../logger/logger.test-utils';
import { isUrlSsrfSafe } from './ssrf.services';

describe('ssrf services', () => {
  describe('isUrlSsrfSafe', () => {
    describe('check if an url can safely be triggered without risking SSRF attacks', () => {
      test('given an url with an hostname being a private/reserved IP, the url is not SSRF safe', async () => {
        expect(await isUrlSsrfSafe({ url: 'http://127.0.0.1/foo/bar' })).toBe(false);
        expect(await isUrlSsrfSafe({ url: 'http://0.0.0.1/foo/bar' })).toBe(false);

        // public IPs for control
        expect(await isUrlSsrfSafe({ url: 'http://1.1.1.1/foo/bar' })).toBe(true);
      });

      test('given an ip, no DNS lookup should be performed', async () => {
        let dnsLookupCalled = false;

        const dnsLookup = async () => {
          dnsLookupCalled = true;
          return { addresses: [] };
        };

        await isUrlSsrfSafe({ url: 'http://127.0.0.1/foo/bar', dnsLookup });

        expect(dnsLookupCalled).toBe(false);
      });

      test('given an url with an hostname, the ip(s) resolved from the hostname must all be SSRF safe for the url to be SSRF safe', async () => {
        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            dnsLookup: async () => ({ addresses: [{ address: '127.0.0.1', family: 4 }] }),
          }),
        ).toBe(false);

        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            dnsLookup: async () => ({ addresses: [{ address: '1.1.1.1', family: 4 }] }),
          }),
        ).toBe(true);
      });

      test('when an hostname resolve to multiple IPs, if at least one of them is not SSRF safe, then the url is not SSRF safe', async () => {
        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            dnsLookup: async () => ({ addresses: [{ address: '127.0.0.1', family: 4 }, { address: '1.1.1.1', family: 4 }] }),
          }),
        ).toBe(false);

        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            dnsLookup: async () => ({ addresses: [{ address: '8.8.8.8', family: 4 }, { address: '1.1.1.1', family: 4 }] }),
          }),
        ).toBe(true);
      });

      test('when an hostname resolve to no IPs, the url is not SSRF safe', async () => {
        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            dnsLookup: async () => ({ addresses: [] }),
          }),
        ).toBe(false);
      });

      test('users can chose to allow specific hostnames, even if they resolve to private/reserved IPs', async () => {
        expect(
          await isUrlSsrfSafe({
            url: 'http://example.com/foo/bar',
            allowedHostnames: new Set(['example.com']),
          }),
        ).toBe(true);

        expect(
          await isUrlSsrfSafe({
            url: 'http://127.0.0.1/foo/bar',
            allowedHostnames: new Set(['127.0.0.1']),
          }),
        ).toBe(true);
      });

      test('given a safe-listed url, no DNS lookup should be performed', async () => {
        let dnsLookupCalled = false;

        const dnsLookup = async () => {
          dnsLookupCalled = true;
          return { addresses: [] };
        };

        await isUrlSsrfSafe({ url: 'http://example.com/foo/bar', allowedHostnames: new Set(['example.com']), dnsLookup });

        expect(dnsLookupCalled).toBe(false);
      });

      test('given an invalid url, the function should return false and not throw', async () => {
        const { logger, getLogs } = createTestLogger();

        expect(await isUrlSsrfSafe({ url: 'not-a-valid-url', logger })).toBe(false);

        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs.length).toBe(1);
        expect(logs[0]).to.contain({ level: 'error', message: 'Error while checking if URL is SSRF safe' });
        expect(logs[0]?.data.error).to.contain({ message: 'Invalid URL', name: 'TypeError' });
      });

      test('given an url with an hostname, if the DNS lookup throws an error, the function should return false and not throw', async () => {
        const dnsLookup = async () => {
          throw new Error('DNS lookup failed');
        };

        const { logger, getLogs } = createTestLogger();

        expect(await isUrlSsrfSafe({ url: 'http://example.com/foo/bar', dnsLookup, logger })).toBe(false);

        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs.length).toBe(1);
        expect(logs[0]).to.contain({ level: 'error', message: 'Error while checking if URL is SSRF safe' });
        expect(logs[0]?.data.error).to.contain({ message: 'DNS lookup failed', name: 'Error' });
      });
    });
  });
});
