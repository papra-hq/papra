import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { publicConfigSchema } from './config.api.contracts';
import { getClientBaseUrl, getPublicConfig, getServerBaseUrl } from './config.models';
import { overrideConfig } from './config.test-utils';

describe('config models', () => {
  describe('getPublicConfig', () => {
    test('only public fields are exposed, without authentication secrets or OAuth credentials', () => {
      const config = overrideConfig({
        foo: 'bar',
        auth: {
          bar: 'baz',
          secret: 'private-auth-secret',
          isEmailVerificationRequired: true,
          isPasswordResetEnabled: true,
          isRegistrationEnabled: true,
          showLegalLinksOnAuthPage: true,
          providers: {
            github: {
              isEnabled: true,
              clientId: 'private-github-client-id',
              clientSecret: 'private-github-client-secret',
            },
            google: {
              isEnabled: false,
            },
            customs: [
              {
                providerId: 'with-icon',
                providerName: 'With icon',
                providerIconUrl: 'https://example.com/icon.svg',
                clientId: 'private-client-id',
                clientSecret: 'private-client-secret',
                discoveryUrl: 'https://example.com/.well-known/openid-configuration',
              },
              {
                providerId: 'without-icon',
                providerName: 'Without icon',
                clientId: 'another-private-client-id',
                clientSecret: 'another-private-client-secret',
              },
            ],
          },
        },
        documents: {
          deletedDocumentsRetentionDays: 30,
          isReprocessingEnabled: true,
        },
        intakeEmails: {
          isEnabled: true,
          driver: 'catch-all',
          drivers: {
            catchAll: {
              domain: 'example.com',
            },
          },
          username: {
            canCustomize: true,
          },
        },
        organizations: {
          deletedOrganizationsPurgeDaysDelay: 30,
        },
      } as DeepPartial<Config>);

      const result = getPublicConfig({
        config,
        intakeEmailsServices: { getDomains: () => ['example.com'] },
      });

      expect(result).toEqual({
        publicConfig: {
          version: 'dev',
          gitCommitSha: 'unknown',
          gitCommitDate: 'unknown',
          auth: {
            isEmailVerificationRequired: true,
            isPasswordResetEnabled: true,
            isRegistrationEnabled: true,
            showLegalLinksOnAuthPage: true,
            providers: {
              github: {
                isEnabled: true,
              },
              google: {
                isEnabled: false,
              },
              customs: [
                {
                  providerId: 'with-icon',
                  providerName: 'With icon',
                  providerIconUrl: 'https://example.com/icon.svg',
                },
                {
                  providerId: 'without-icon',
                  providerName: 'Without icon',
                },
              ],
              email: {
                isEnabled: true,
              },
            },
          },
          documents: {
            deletedDocumentsRetentionDays: 30,
            isReprocessingEnabled: true,
          },
          intakeEmails: {
            isEnabled: true,
            address: {
              canCustomizeUsername: true,
              domains: ['example.com'],
            },
          },
          organizations: {
            deletedOrganizationsPurgeDaysDelay: 30,
          },
          autoTagging: {
            isEnabled: false,
          },
          aiExtraction: {
            isEnabled: false,
          },
        },
      });
      expect(v.parse(publicConfigSchema, JSON.parse(JSON.stringify(result.publicConfig)))).toEqual(
        result.publicConfig,
      );
    });

    test('exposes an empty domain list when the intake email driver has no selectable domains', () => {
      const config = overrideConfig();

      expect(
        getPublicConfig({ config, intakeEmailsServices: { getDomains: () => [] } }).publicConfig
          .intakeEmails,
      ).to.eql({
        isEnabled: false,
        address: {
          canCustomizeUsername: false,
          domains: [],
        },
      });
    });

    test('exposes the selectable domains returned by the intake email driver', () => {
      const config = overrideConfig();

      expect(
        getPublicConfig({
          config,
          intakeEmailsServices: { getDomains: () => ['relay.example.com'] },
        }).publicConfig.intakeEmails,
      ).to.eql({
        isEnabled: false,
        address: {
          canCustomizeUsername: false,
          domains: ['relay.example.com'],
        },
      });
    });
  });

  describe('getServerBaseUrl', () => {
    test('use the generic baseUrl if set, otherwise use the server baseUrl', () => {
      expect(getServerBaseUrl({ config: { appBaseUrl: 'https://papra.app' } as Config })).to.eql({
        serverBaseUrl: 'https://papra.app',
      });
      expect(
        getServerBaseUrl({ config: { server: { baseUrl: 'http://localhost:1221' } } as Config }),
      ).to.eql({ serverBaseUrl: 'http://localhost:1221' });
      expect(
        getServerBaseUrl({
          config: {
            appBaseUrl: 'https://papra.app',
            server: { baseUrl: 'http://localhost:1221' },
          } as Config,
        }),
      ).to.eql({ serverBaseUrl: 'https://papra.app' });
    });
  });

  describe('getClientBaseUrl', () => {
    test('use the generic baseUrl if set, otherwise use the client baseUrl', () => {
      expect(getClientBaseUrl({ config: { appBaseUrl: 'https://papra.app' } as Config })).to.eql({
        clientBaseUrl: 'https://papra.app',
      });
      expect(
        getClientBaseUrl({ config: { client: { baseUrl: 'http://localhost:3000' } } as Config }),
      ).to.eql({ clientBaseUrl: 'http://localhost:3000' });
      expect(
        getClientBaseUrl({
          config: {
            appBaseUrl: 'https://papra.app',
            client: { baseUrl: 'http://localhost:3000' },
          } as Config,
        }),
      ).to.eql({ clientBaseUrl: 'https://papra.app' });
    });
  });
});
