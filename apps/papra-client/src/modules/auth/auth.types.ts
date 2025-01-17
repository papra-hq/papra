import type { ssoProviders } from './auth.constants';

export type SsoProviderKey = (typeof ssoProviders)[number]['key'];
