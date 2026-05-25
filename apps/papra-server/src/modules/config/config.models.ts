import type { DeepPartial } from '@corentinth/chisels';
import type { Logger } from '@crowlog/logger';
import type { Config } from './config.types';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { pick } from '../shared/objects';

export function getPublicConfig({ config }: { config: Config }) {
  const publicConfig: DeepPartial<Config> = {
    version: config.version,
    gitCommitSha: config.gitCommitSha,
    gitCommitDate: config.gitCommitDate,
    auth: {
      isEmailVerificationRequired: config.auth.isEmailVerificationRequired,
      isPasswordResetEnabled: config.auth.isPasswordResetEnabled,
      isRegistrationEnabled: config.auth.isRegistrationEnabled,
      showLegalLinksOnAuthPage: config.auth.showLegalLinksOnAuthPage,
      providers: {
        email: { isEnabled: config.auth.providers.email.isEnabled },
        github: { isEnabled: config.auth.providers.github.isEnabled },
        google: { isEnabled: config.auth.providers.google.isEnabled },
        customs: config.auth.providers.customs?.map(custom => pick(custom, [
          'providerId',
          'providerName',
          'providerIconUrl',
        ])) ?? [],
      },
    },
    documents: { deletedDocumentsRetentionDays: config.documents.deletedDocumentsRetentionDays },
    intakeEmails: { isEnabled: config.intakeEmails.isEnabled },
    organizations: { deletedOrganizationsPurgeDaysDelay: config.organizations.deletedOrganizationsPurgeDaysDelay },
  };

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
