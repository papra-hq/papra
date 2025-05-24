import type { ssoProviders } from './auth.constants';

export type SsoProviderKey = (typeof ssoProviders)[number]['key'] | string & {};
export type SsoProviderConfig = { key: SsoProviderKey; name: string; icon: string };
