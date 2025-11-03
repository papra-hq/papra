import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ApiProvider } from '@/providers/api-provider';
import 'react-native-reanimated';

export default function RootLayout() {

  return (
    <ApiProvider>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="organizations/select" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ApiProvider>
  );
}
