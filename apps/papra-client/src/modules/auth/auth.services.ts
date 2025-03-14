import { organizationClient as organizationClientPlugin } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/solid';

import { buildTimeConfig } from '../config/config';
import { trackingServices } from '../tracking/tracking.services';
import { createDemoAuthClient } from './auth.demo.services';

export function createAuthClient() {
  const client = createBetterAuthClient({
    baseURL: buildTimeConfig.baseApiUrl,
    plugins: [organizationClientPlugin()],
  });

  return {
    // we can't spread the client because it a proxy object
    signIn: client.signIn,
    signUp: client.signUp,
    forgetPassword: client.forgetPassword,
    resetPassword: client.resetPassword,
    sendVerificationEmail: client.sendVerificationEmail,
    useSession: client.useSession,
    organization: client.organization,
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
  organization: organizationClient,
} = buildTimeConfig.isDemoMode
  ? createDemoAuthClient()
  : createAuthClient();
