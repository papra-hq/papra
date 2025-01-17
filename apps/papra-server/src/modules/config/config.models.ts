import type { DeepPartial } from '@corentinth/chisels';
import type { Context } from '../app/server.types';
import type { Config } from './config.types';
import { pick } from 'lodash-es';

export function getConfig({ context }: { context: Context }) {
  const config = context.get('config');

  if (!config) {
    throw new Error('Config not found, getConfig must be called after the config middleware.');
  }

  return { config };
}

export function getPublicConfig({ config }: { config: Config }) {
  const publicConfig: DeepPartial<Config> = pick(config, [
    'auth.isEmailVerificationRequired',
    'auth.isPasswordResetEnabled',
    'auth.isRegistrationEnabled',
    'auth.providers.github.isEnabled',
  ]);

  return {
    publicConfig,
  };
}
