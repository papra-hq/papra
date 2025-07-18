import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { merge, pick } from 'lodash-es';

export function getPublicConfig({ config }: { config: Config }) {
  const publicConfig: DeepPartial<Config> = merge(
    pick(config, [
      'auth.isEmailVerificationRequired',
      'auth.isPasswordResetEnabled',
      'auth.isRegistrationEnabled',
      'auth.showLegalLinksOnAuthPage',
      'auth.providers.email.isEnabled',
      'auth.providers.github.isEnabled',
      'auth.providers.google.isEnabled',
      'documents.deletedDocumentsRetentionDays',
      'intakeEmails.isEnabled',
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
