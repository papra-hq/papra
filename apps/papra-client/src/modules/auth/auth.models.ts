import type { Config } from '../config/config';
import { get } from 'lodash-es';
import { ssoProviders } from './auth.constants';

export function isAuthErrorWithCode({ error, code }: { error: unknown; code: string }) {
  return get(error, 'code') === code;
}

export const isEmailVerificationRequiredError = ({ error }: { error: unknown }) => isAuthErrorWithCode({ error, code: 'EMAIL_NOT_VERIFIED' });

export function getEnabledSsoProviderConfigs({ config }: { config: Config }) {
  const enabledSsoProviders = ssoProviders.filter(({ key }) => get(config, `auth.providers.${key}.isEnabled`));

  return enabledSsoProviders;
}
