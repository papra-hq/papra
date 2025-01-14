import { createAuthClient } from 'better-auth/solid';
import { config } from '../config/config';

export const {
  useSession,
  signIn,
  signOut,

} = createAuthClient({
  baseURL: config.baseApiUrl,
});
