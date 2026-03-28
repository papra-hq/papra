import { describe, expect, test } from 'vitest';
import { getThemeFromPreference, isValidThemePreference } from './theme.models';

describe('theme models', () => {
  describe('isValidThemePreference', () => {
    test('valid theme preferences are either "light", "dark" or "system"', () => {
      expect(isValidThemePreference('light')).toBe(true);
      expect(isValidThemePreference('dark')).toBe(true);
      expect(isValidThemePreference('system')).toBe(true);

      expect(isValidThemePreference('invalid')).toBe(false);
      expect(isValidThemePreference(123)).toBe(false);
      expect(isValidThemePreference(null)).toBe(false);
      expect(isValidThemePreference(undefined)).toBe(false);
      expect(isValidThemePreference({})).toBe(false);
    });
  });

  describe('getThemeFromPreference', () => {
    test('returns the system theme when preference is "system", otherwise returns the theme preference', () => {
      expect(getThemeFromPreference({ themePreference: 'light', systemTheme: 'dark' })).toBe('light');
      expect(getThemeFromPreference({ themePreference: 'light', systemTheme: 'light' })).toBe('light');

      expect(getThemeFromPreference({ themePreference: 'dark', systemTheme: 'dark' })).toBe('dark');
      expect(getThemeFromPreference({ themePreference: 'dark', systemTheme: 'light' })).toBe('dark');

      expect(getThemeFromPreference({ themePreference: 'system', systemTheme: 'dark' })).toBe('dark');
      expect(getThemeFromPreference({ themePreference: 'system', systemTheme: 'light' })).toBe('light');
    });
  });
});
