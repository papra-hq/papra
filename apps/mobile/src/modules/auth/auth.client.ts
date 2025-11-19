import { expoClient } from '@better-auth/expo/client';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AuthClient = ReturnType<typeof createAuthClient>;

export function createAuthClient({ baseUrl}: { baseUrl: string }) {
  return createBetterAuthClient({
    baseURL: baseUrl,
    plugins: [
      expoClient({
        scheme: String(Constants.expoConfig?.scheme ?? 'papra'),
        storagePrefix: String(Constants.expoConfig?.scheme ?? 'papra'),
        storage: Platform.OS === 'web'
          ? localStorage
          : SecureStore,
      }),
    ],
  });
}
