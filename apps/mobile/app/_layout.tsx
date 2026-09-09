import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ShareIntentProvider } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/modules/app/providers/app-providers';
import { ShareIntentHandler } from '@/modules/documents/components/share-intent-handler';

import { useColorScheme } from '@/modules/ui/providers/use-color-scheme';
import 'react-native-reanimated';
import { LocaleProvider } from '@/modules/i18n/hooks/use-locale';

// Splash screen control is best-effort; failures must not block app startup.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <LocaleProvider>
      <LocalizedLayout />
    </LocaleProvider>
  );
}

function LocalizedLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <ShareIntentProvider>
      <AppProviders>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="config/server-selection" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen
              name="app-settings"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <ShareIntentHandler />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProviders>
    </ShareIntentProvider>
  );
}
