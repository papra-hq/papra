import type { Component } from 'solid-js';
import type { ThemePreference } from './theme.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/modules/ui/components/dropdown-menu';
import { useTheme } from './theme.provider';

export const ThemeSwitcher: Component = () => {
  const { getThemePreference, setThemePreference } = useTheme();
  const { t } = useI18n();

  return (
    <DropdownMenuRadioGroup value={getThemePreference()} onChange={value => setThemePreference(value as ThemePreference)}>
      <DropdownMenuRadioItem value="light" disabled={getThemePreference() === 'light'}>
        {t('layout.theme.light')}
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark" disabled={getThemePreference() === 'dark'}>
        {t('layout.theme.dark')}
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system" disabled={getThemePreference() === 'system'}>
        {t('layout.theme.system')}
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
};
