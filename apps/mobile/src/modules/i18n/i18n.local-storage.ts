import type { LocaleKey } from './locales';
import { buildStorageKey } from '../lib/local-storage/local-storage.models';
import { storage } from '../lib/local-storage/local-storage.services';
import { LOCALE_KEYS } from './locales';

export type LocalePreference = LocaleKey | null;

const LOCALE_PREFERENCE_KEY = buildStorageKey(['i18n', 'locale-preference']);

export const i18nLocalStorage = {
  getLocalePreference: async (): Promise<LocalePreference> => {
    try {
      const storedLocale = await storage.getItem(LOCALE_PREFERENCE_KEY);

      return LOCALE_KEYS.find((key) => key === storedLocale) ?? null;
    } catch {
      // Storage failures should not prevent the app from following the device language.
      return null;
    }
  },

  setLocalePreference: async (preference: LocalePreference): Promise<void> => {
    if (preference === null) {
      await storage.removeItem(LOCALE_PREFERENCE_KEY);
      return;
    }

    await storage.setItem(LOCALE_PREFERENCE_KEY, preference);
  },
};
