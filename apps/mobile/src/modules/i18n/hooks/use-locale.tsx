import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { LocaleKey } from '../locales';
import { useLocales } from 'expo-localization';
import { getDeviceLanguageTag, resolveUserLocale } from '../locales.models';
import type { LocalePreference } from '../i18n.local-storage';
import { i18nLocalStorage } from '../i18n.local-storage';

type LocaleProviderContext = {
  locale: LocaleKey;
  deviceLanguageTag: string;
  localePreference: LocalePreference;
  setLocalePreference: (preference: LocalePreference) => Promise<void>;
};

const LocaleContext = createContext<LocaleProviderContext | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const userLocales = useLocales();
  const [localePreference, setPreference] = useState<LocalePreference>(null);
  const [isLocaleLoaded, setIsLocaleLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void i18nLocalStorage.getLocalePreference().then((preference) => {
      if (!cancelled) {
        setPreference(preference);
        setIsLocaleLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocalePreference = async (preference: LocalePreference) => {
    // Only update the active preference once it has been saved successfully.
    await i18nLocalStorage.setLocalePreference(preference);
    setPreference(preference);
  };

  const locale = localePreference ?? resolveUserLocale<LocaleKey>(userLocales);
  const deviceLanguageTag = getDeviceLanguageTag(userLocales);

  if (!isLocaleLoaded) {
    return null;
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        deviceLanguageTag,
        localePreference,
        setLocalePreference,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return context;
}
