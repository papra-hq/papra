import type { Config } from '../config/config';

import type { SsoProviderConfig } from './auth.types';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/solid';
import { buildTimeConfig } from '../config/config';
import { trackingServices } from '../tracking/tracking.services';
import { createDemoAuthClient } from './auth.demo.services';

export function createAuthClient() {
  const client = createBetterAuthClient({
    baseURL: buildTimeConfig.baseApiUrl,
    plugins: [
      genericOAuthClient(),
    ],
  });

  return {
    // we can't spread the client because it is a proxy object
    signIn: client.signIn,
    signUp: client.signUp,
    forgetPassword: client.forgetPassword,
    resetPassword: client.resetPassword,
    sendVerificationEmail: client.sendVerificationEmail,
    useSession: client.useSession,
    signOut: async () => {
      trackingServices.capture({ event: 'User logged out' });
      const result = await client.signOut();
      trackingServices.reset();

      return result;
    },
  };
}

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  forgetPassword,
  resetPassword,
  sendVerificationEmail,
} = buildTimeConfig.isDemoMode
  ? createDemoAuthClient()
  : createAuthClient();

export async function authWithProvider({ provider, config }: { provider: SsoProviderConfig; config: Config }) {
  const isCustomProvider = config.auth.providers.customs.some(({ providerId }) => providerId === provider.key);

  if (isCustomProvider) {
    const { error } = await signIn.oauth2({
      providerId: provider.key,
      callbackURL: config.baseUrl,
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await signIn.social({ provider: provider.key as 'github' | 'google', callbackURL: config.baseUrl });

  if (error) {
    throw error;
  }
}
