import type { DeepPartial } from '@corentinth/chisels';
import type { Logger } from '@crowlog/logger';
import type { Config } from './config.types';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { merge, pick } from 'lodash-es';

export function getPublicConfig({ config }: { config: Config }) {
  const publicConfig: DeepPartial<Config> = merge(
    pick(config, [
      'version',
      'gitCommitSha',
      'gitCommitDate',
      'auth.isEmailVerificationRequired',
      'auth.isPasswordResetEnabled',
      'auth.isRegistrationEnabled',
      'auth.showLegalLinksOnAuthPage',
      'auth.providers.email.isEnabled',
      'auth.providers.github.isEnabled',
      'auth.providers.google.isEnabled',
      'documents.deletedDocumentsRetentionDays',
      'intakeEmails.isEnabled',
      'organizations.deletedOrganizationsPurgeDaysDelay',
    ]),
    {
      auth: {
        providers: {
          customs: config?.auth?.providers?.customs?.map(custom => pick(custom, [
            'providerId',
            'providerName',
            'providerIconUrl',
          ])) ?? [],
        },
      },
    },
  );

  return {
    publicConfig,
  };
}

export function getServerBaseUrl({ config }: { config: Config }) {
  return {
    serverBaseUrl: config.appBaseUrl ?? config.server.baseUrl,
  };
}

export function getClientBaseUrl({ config }: { config: Config }) {
  return {
    clientBaseUrl: config.appBaseUrl ?? config.client.baseUrl,
  };
}

export function exitProcessDueToConfigError({ error, logger }: { error: Error; logger: Logger }): never {
  logger.error({ error }, `Invalid configuration: ${error.message}`);
  process.exit(1);
}

export function validateParsedConfig({ config, logger, validators }: { config: Config; logger: Logger; validators: ((args: { config: Config }) => void)[] }) {
  for (const validator of validators) {
    const [,error] = safelySync(() => validator({ config }));

    if (error) {
      exitProcessDueToConfigError({ error, logger });
    }
  }
}
