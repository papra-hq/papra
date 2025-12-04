import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ApiProvider } from '@/modules/api/providers/api.provider';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ApiProvider>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(with-organizations)" options={{ headerShown: false }} />
        <Stack.Screen
          name="document/view"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ApiProvider>
  );
}
