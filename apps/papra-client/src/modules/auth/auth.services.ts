import { createAuthClient } from 'better-auth/solid';
import { config } from '../config/config';
import { createDemoAuthClient } from './auth.demo.services';

export const {
  useSession,
  signIn,
  signOut,
} = config.isDemoMode
  ? createDemoAuthClient()
  : createAuthClient({
      baseURL: config.baseApiUrl,
    });
