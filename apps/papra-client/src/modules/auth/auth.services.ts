import { createAuthClient } from 'better-auth/solid';
import { buildTimeConfig } from '../config/config';
import { createDemoAuthClient } from './auth.demo.services';

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
  : createAuthClient({
      baseURL: buildTimeConfig.baseApiUrl,
    });
