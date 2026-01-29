import type { ServerConfig } from '../config/config.types';

export function getEnabledOAuthProviders({ serverConfig }: { serverConfig?: ServerConfig }) {
  if (!serverConfig) {
    return [];
  }

  const providers = serverConfig.auth.providers;

  return [
    ...(providers.google.isEnabled ? [{ providerId: 'google', providerName: 'Google' }] : []),
    ...(providers.github.isEnabled ? [{ providerId: 'github', providerName: 'GitHub' }] : []),
    ...providers.customs,
  ];
}
