/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import type { ThemeColors } from '../theme.constants';
import { colors } from '../theme.constants';
import { useColorScheme } from './use-color-scheme';

export function useThemeColor(): ThemeColors {
  const theme = useColorScheme() ?? 'light';

  return colors[theme];
}
