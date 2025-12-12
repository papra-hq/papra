import { DEFAULT_AUTH_SECRET } from './auth.constants';
import { createAuthSecretIsDefaultError } from './auth.errors';

export function ensureAuthSecretIsNotDefaultInProduction({
  config,
  defaultAuthSecret = DEFAULT_AUTH_SECRET,
}: {
  config: { auth: { secret: string }; env: string };
  defaultAuthSecret?: string;
}) {
  if (config.env === 'production' && config.auth.secret === defaultAuthSecret) {
    throw createAuthSecretIsDefaultError();
  }
}
