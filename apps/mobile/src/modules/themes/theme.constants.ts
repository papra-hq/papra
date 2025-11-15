/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const colors = {
  light: {
    foreground: '#0a0a0a',
    background: '#fafafa',
    primary: '#fe7d4d',
    primaryForeground: '#0a0a0a',
    mutedForeground: '#737373',
  },
  dark: {
    foreground: '#fafafa',
    background: '#141414',
    primary: '#d9ff7a',
    primaryForeground: '#fafafa',
    mutedForeground: '#a3a3a3',
  },
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
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, \'Times New Roman\', serif',
    rounded: '\'SF Pro Rounded\', \'Hiragino Maru Gothic ProN\', Meiryo, \'MS PGothic\', sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, \'Liberation Mono\', \'Courier New\', monospace',
  },
});
