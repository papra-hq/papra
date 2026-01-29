import type { ServerConfig } from '../config/config.types';
import { describe, expect, test } from 'vitest';
import { getEnabledOAuthProviders } from './auth.models';

describe('auth models', () => {
  describe('getEnabledOAuthProviders', () => {
    test('build an ordered list of enabled OAuth providers', () => {
      expect(
        getEnabledOAuthProviders({ serverConfig: {
          auth: {
            providers: {
              google: { isEnabled: true },
              github: { isEnabled: true },
              customs: [
                { providerId: 'custom1', providerName: 'Custom 1' },
              ],
            },
          },
        } as ServerConfig }),
      ).to.eql([
        { providerId: 'google', providerName: 'Google' },
        { providerId: 'github', providerName: 'GitHub' },
        { providerId: 'custom1', providerName: 'Custom 1' },
      ]);

      expect(
        getEnabledOAuthProviders({ serverConfig: {
          auth: {
            providers: {
              google: { isEnabled: true },
              github: { isEnabled: false },
              customs: [
                { providerId: 'custom1', providerName: 'Custom 1' },
              ],
            },
          },
        } as ServerConfig }),
      ).to.eql([
        { providerId: 'google', providerName: 'Google' },
        { providerId: 'custom1', providerName: 'Custom 1' },
      ]);

      expect(
        getEnabledOAuthProviders({ serverConfig: {
          auth: {
            providers: {
              google: { isEnabled: false },
              github: { isEnabled: false },
              customs: [
                { providerId: 'custom1', providerName: 'Custom 1' },
              ],
            },
          },
        } as ServerConfig }),
      ).to.eql([
        { providerId: 'custom1', providerName: 'Custom 1' },
      ]);

      expect(
        getEnabledOAuthProviders({ serverConfig: {
          auth: {
            providers: {
              google: { isEnabled: false },
              github: { isEnabled: false },
              customs: [] as { providerId: string; providerName: string }[],
            },
          },
        } as ServerConfig }),
      ).to.eql([]);
    });

    test('returns an empty array if serverConfig is undefined, like during initial loading', () => {
      expect(getEnabledOAuthProviders({ serverConfig: undefined })).to.eql([]);
    });
  });
});
