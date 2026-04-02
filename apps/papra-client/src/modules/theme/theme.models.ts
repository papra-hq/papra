import type { Theme, ThemePreference } from './theme.types';
import { THEME_PREFERENCES } from './theme.constants';

export function isValidThemePreference(value: unknown): value is ThemePreference {
  return (
    value === THEME_PREFERENCES.LIGHT
    || value === THEME_PREFERENCES.DARK
    || value === THEME_PREFERENCES.SYSTEM
  );
}

export function getThemeFromPreference({ themePreference, systemTheme }: { themePreference: ThemePreference; systemTheme: Theme }): Theme {
  if (themePreference === THEME_PREFERENCES.SYSTEM) {
    return systemTheme;
  }

  return themePreference;
}
