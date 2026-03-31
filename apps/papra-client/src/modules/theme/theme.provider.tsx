import type { ParentComponent } from 'solid-js';
import type { Theme, ThemePreference } from './theme.types';
import { createContext, createSignal, onCleanup, useContext } from 'solid-js';
import { DEFAULT_THEME_PREFERENCE, THEME_ATTRIBUTE, THEME_STORAGE_KEY } from './theme.constants';
import { getThemeFromPreference, isValidThemePreference } from './theme.models';

const themeContext = createContext<{
  getTheme: () => Theme;
  getThemePreference: () => ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
}>();

export function useTheme() {
  const context = useContext(themeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export const ThemeProvider: ParentComponent = (props) => {
  const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const [systemTheme, setSystemTheme] = createSignal<Theme>(themeMediaQuery.matches ? 'dark' : 'light');

  const getInitialThemePreference = (): ThemePreference => {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);

    if (isValidThemePreference(storedPreference)) {
      return storedPreference;
    }

    return DEFAULT_THEME_PREFERENCE;
  };

  const [getLocalThemePreference, setLocalThemePreference] = createSignal<ThemePreference>(getInitialThemePreference());

  const getTheme = () => getThemeFromPreference({ themePreference: getLocalThemePreference(), systemTheme: systemTheme() });

  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  };

  const setThemePreference = (newPreference: ThemePreference) => {
    setLocalThemePreference(newPreference);
    localStorage.setItem(THEME_STORAGE_KEY, newPreference);

    const newTheme = getThemeFromPreference({ themePreference: newPreference, systemTheme: systemTheme() });
    applyTheme(newTheme);
  };

  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    const newSystemTheme: Theme = e.matches ? 'dark' : 'light';
    setSystemTheme(newSystemTheme);

    if (getLocalThemePreference() === 'system') {
      applyTheme(newSystemTheme);
    }
  };

  themeMediaQuery.addEventListener('change', handleSystemThemeChange);
  onCleanup(() => {
    themeMediaQuery.removeEventListener('change', handleSystemThemeChange);
  });

  return (
    <themeContext.Provider
      value={{
        getTheme,
        getThemePreference: getLocalThemePreference,
        setThemePreference,
      }}
    >
      {props.children}
    </themeContext.Provider>
  );
};
