import { organizationClient as organizationClientPlugin } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/solid';

import { buildTimeConfig } from '../config/config';
import { createDemoAuthClient } from './auth.demo.services';

export function createAuthClient() {
  return createBetterAuthClient({
    baseURL: buildTimeConfig.baseApiUrl,
    plugins: [organizationClientPlugin()],
  });
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
