import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { publicConfigSchema } from './config.api.contracts';
import { configDefinition } from './config';
import { getClientBaseUrl, getConfigDefinitionEnvNames, getPublicConfig, getServerBaseUrl, resolveEnvVarsFromFiles } from './config.models';
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

  describe('getConfigDefinitionEnvNames', () => {
    test('collects env names from nested definitions, including env name lists', () => {
      expect(getConfigDefinitionEnvNames({
        configDefinition: {
          a: { schema: v.string(), env: 'A' },
          nested: { b: { schema: v.string(), env: ['B1', 'B2'] }, c: { schema: v.string(), default: 'c' } },
        },
      }).sort()).to.eql(['A', 'B1', 'B2']);
    });

    test('the real config definition exposes its env names', () => {
      const names = getConfigDefinitionEnvNames({ configDefinition });

      expect(names).to.include('AUTH_SECRET');
    });
  });

  describe('resolveEnvVarsFromFiles', () => {
    const definition = {
      secret: { schema: v.string(), env: 'AUTH_SECRET' },
      other: { schema: v.string(), env: 'OTHER' },
    };
    const files: Record<string, string> = { '/run/secrets/auth': 'my-secret\n', '/run/secrets/crlf': 'crlf-secret\r\n', '/run/secrets/spaces': '  padded  \n\n' };
    const readTextFile = async (path: string) => {
      if (path in files) {
        return files[path]!;
      }
      throw new Error('ENOENT: no such file or directory');
    };

    test('the value of <ENV>_FILE file is used as <ENV>, without the trailing newline', async () => {
      const { env } = await resolveEnvVarsFromFiles({
        env: { AUTH_SECRET_FILE: '/run/secrets/auth', OTHER: 'value' },
        configDefinition: definition,
        readTextFile,
      });

      expect(env).to.eql({ AUTH_SECRET_FILE: '/run/secrets/auth', AUTH_SECRET: 'my-secret', OTHER: 'value' });
      expect((await resolveEnvVarsFromFiles({ env: { AUTH_SECRET_FILE: '/run/secrets/crlf' }, configDefinition: definition, readTextFile })).env.AUTH_SECRET).to.eql('crlf-secret');
      expect((await resolveEnvVarsFromFiles({ env: { AUTH_SECRET_FILE: '/run/secrets/spaces' }, configDefinition: definition, readTextFile })).env.AUTH_SECRET).to.eql('  padded  \n');
    });

    test('the env is left untouched when no _FILE variable is set or it is empty', async () => {
      const input = { AUTH_SECRET: 'direct', OTHER_FILE: '' };

      expect((await resolveEnvVarsFromFiles({ env: input, configDefinition: definition, readTextFile })).env).to.eql(input);
    });

    test('_FILE variables of unknown env names are ignored', async () => {
      const input = { UNKNOWN_FILE: '/run/secrets/auth' };

      expect((await resolveEnvVarsFromFiles({ env: input, configDefinition: definition, readTextFile })).env).to.eql(input);
    });

    test('setting both <ENV> and <ENV>_FILE is an error', async () => {
      await expect(resolveEnvVarsFromFiles({
        env: { AUTH_SECRET: 'direct', AUTH_SECRET_FILE: '/run/secrets/auth' },
        configDefinition: definition,
        readTextFile,
      })).rejects.toThrow('Both AUTH_SECRET and AUTH_SECRET_FILE are set, only one of them can be used');
    });

    test('an unreadable file is reported with the variable and path', async () => {
      await expect(resolveEnvVarsFromFiles({
        env: { AUTH_SECRET_FILE: '/run/secrets/missing' },
        configDefinition: definition,
        readTextFile,
      })).rejects.toThrow('Unable to read the file "/run/secrets/missing" referenced by AUTH_SECRET_FILE: ENOENT');
    });
  });
});
