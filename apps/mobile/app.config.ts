import type { ExpoConfig } from 'expo/config';
import { execFileSync } from 'node:child_process';
import { version } from './package.json';

function getGitCommitSha() {
  const commitSha = process.env.EAS_BUILD_GIT_COMMIT_HASH || process.env.GIT_COMMIT;

  if (commitSha) {
    return commitSha.trim();
  }

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

const isDevelopment = process.env.APP_VARIANT === 'development';

const profile = isDevelopment
  ? {
      name: 'Papra - dev',
      scheme: 'papra-dev',
      ios: { bundleIdentifier: 'app.papra.ios.dev' },
      android: { package: 'app.papra.android.dev' },
    }
  : {
      name: 'Papra',
      scheme: 'papra',
      ios: { bundleIdentifier: 'app.papra.ios' },
      android: { package: 'app.papra.android' },
    };

const config: ExpoConfig = {
  name: profile.name,
  slug: 'papra',
  version,
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: profile.scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: profile.ios.bundleIdentifier,
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
    package: profile.android.package,
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
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    gitCommitSha: getGitCommitSha(),
    router: {},
    eas: {
      projectId: '8d127afd-9d57-415b-a108-3e7b85439cfd',
    },
  },
};

export default config;
