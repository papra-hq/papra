/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from '@/modules/themes/hooks/use-color-scheme';
import { colors } from '@/modules/themes/theme.constants';

export function useThemeColor() {
  const theme = useColorScheme() ?? 'light';

  return colors[theme];
}
