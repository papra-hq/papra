import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/modules/app/providers/app-providers';
import { ShareIntentHandler } from '@/modules/documents/components/share-intent-handler';

import { useColorScheme } from '@/modules/ui/providers/use-color-scheme';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ShareIntentProvider>
      <AppProviders>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="config/server-selection" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <ShareIntentHandler />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProviders>
    </ShareIntentProvider>
  );
}
