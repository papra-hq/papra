import type { ExpoConfig } from 'expo/config';
import { version } from './package.json';

const config: ExpoConfig = {
  name: 'Papra',
  slug: 'papra',
  version,
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: 'papra',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.papra.ios',
    icon: {
      dark: './src/assets/images/icon-dark.png',
      light: './src/assets/images/icon-light.png',
      tinted: './src/assets/images/icon-tinted.png',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1A181A',
      foregroundImage: './src/assets/images/android-icon-foreground.png',
      backgroundImage: './src/assets/images/android-icon-background.png',
      monochromeImage: './src/assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'app.papra.android',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          // Allow http for selfhosters that connect to their own server in their LAN
          usesCleartextTraffic: true,
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './src/assets/images/splash-icon-dark.png',
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsFileWithMaxCount: 10,
          NSExtensionActivationSupportsImageWithMaxCount: 10,
        },
        androidIntentFilters: ['*/*'],
        androidMultiIntentFilters: ['*/*'],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '8d127afd-9d57-415b-a108-3e7b85439cfd',
    },
  },
};

export default config;
