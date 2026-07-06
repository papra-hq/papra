/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const lightColors = {
  foreground: '#1c1a16',
  background: '#f6f4f1',
  primary: '#fe7d4d',
  primaryForeground: '#0a0a0a',
  muted: '#f3f3f3',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  secondaryBackground: '#ffffff',
  destructive: '#d32f2f',
  destructiveBackground: '#ffe0e0',
};

const darkColors: ThemeColors = {
  foreground: '#f2efea',
  background: '#111010',
  primary: '#d9ff7a',
  primaryForeground: '#0a0a0a',
  muted: '#262626',
  mutedForeground: '#a59f96',
  border: '#262626',
  secondaryBackground: '#1b1a18',
  destructive: '#ff6b6b',
  destructiveBackground: '#2a1a1a',
};

export type ThemeColors = typeof lightColors;

export const colors = {
  light: lightColors,
  dark: darkColors,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
