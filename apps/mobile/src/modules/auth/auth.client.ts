import { expoClient } from '@better-auth/expo/client';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { APP_SCHEME } from '../app/app.constants';

export type AuthClient = ReturnType<typeof createAuthClient>;

export function createAuthClient({ baseUrl}: { baseUrl: string }) {
  return createBetterAuthClient({
    baseURL: baseUrl,
    plugins: [
      expoClient({
        scheme: APP_SCHEME,
        storagePrefix: APP_SCHEME,
        storage: Platform.OS === 'web'
          ? localStorage
          : SecureStore,
      }),
    ],
  });
}
