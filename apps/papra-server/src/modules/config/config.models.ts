import type { DeepPartial } from '@corentinth/chisels';
import type { Logger } from '@crowlog/logger';
import type { IntakeEmailsServices } from '../intake-emails/drivers/intake-emails.drivers.models';
import type { Config } from './config.types';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { pick } from '../shared/objects';

type PublicConfig = Omit<DeepPartial<Config>, 'intakeEmails'> & {
  intakeEmails: {
    isEnabled: boolean;
    address: {
      canCustomizeUsername: boolean;
      domains: string[];
    };
  };
};

export function getPublicConfig({
  config,
  intakeEmailsServices,
}: {
  config: Config;
  intakeEmailsServices: Pick<IntakeEmailsServices, 'getDomains'>;
}) {
  const publicConfig: PublicConfig = {
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
        customs:
          config.auth.providers.customs?.map((custom) =>
            pick(custom, ['providerId', 'providerName', 'providerIconUrl']),
          ) ?? [],
      },
    },
    documents: { deletedDocumentsRetentionDays: config.documents.deletedDocumentsRetentionDays },
    intakeEmails: {
      isEnabled: config.intakeEmails.isEnabled,
      address: {
        canCustomizeUsername: config.intakeEmails.username.canCustomize,
        domains: intakeEmailsServices.getDomains(),
      },
    },
    organizations: {
      deletedOrganizationsPurgeDaysDelay: config.organizations.deletedOrganizationsPurgeDaysDelay,
    },
    autoTagging: {
      isEnabled: config.autoTagging.isEnabled && config.ai.isEnabled,
    },
    autoNaming: {
      isEnabled: config.autoNaming.isEnabled && config.ai.isEnabled,
    },
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

export function exitProcessDueToConfigError({
  error,
  logger,
}: {
  error: Error;
  logger: Logger;
}): never {
  logger.error({ error }, `Invalid configuration: ${error.message}`);
  process.exit(1);
}

export function validateParsedConfig({
  config,
  logger,
  validators,
}: {
  config: Config;
  logger: Logger;
  validators: ((args: { config: Config }) => void)[];
}) {
  for (const validator of validators) {
    const [, error] = safelySync(() => validator({ config }));

    if (error) {
      exitProcessDueToConfigError({ error, logger });
    }
  }
}
