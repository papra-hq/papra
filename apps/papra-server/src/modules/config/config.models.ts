import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { pick } from 'lodash-es';

export function getPublicConfig({ config }: { config: Config }) {
  const publicConfig: DeepPartial<Config> = pick(config, [
    'auth.isEmailVerificationRequired',
    'auth.isPasswordResetEnabled',
    'auth.isRegistrationEnabled',
    'auth.showLegalLinksOnAuthPage',
    'auth.providers.github.isEnabled',
    'auth.providers.google.isEnabled',
    'documents.deletedDocumentsRetentionDays',
    'intakeEmails.isEnabled',
    'intakeEmails.emailGenerationDomain',
  ]);

  return {
    publicConfig,
  };
}
