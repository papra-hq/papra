import type { PartialMessages } from './i18n.types';
import { en } from './translations/en';
import { fr } from './translations/fr';

export const locales = {
  en: {
    name: 'English',
    messages: en,
  },
  fr: {
    name: 'Français',
    messages: fr,
  },
};

export type LocaleKey = keyof typeof locales;

export const LOCALE_KEYS: LocaleKey[] = Object.keys(locales) as LocaleKey[];
export const DEFAULT_LOCALE_KEY = 'en';

export type DefaultLocaleKey = typeof DEFAULT_LOCALE_KEY;
export type NonDefaultLocaleKey = Exclude<LocaleKey, DefaultLocaleKey>;

// Partial but the default locale is required
export type LocaleRecord<Default, NonDefault = Default> = Partial<
  Record<NonDefaultLocaleKey, NonDefault>
> &
  Record<DefaultLocaleKey, Default>;

export type LocaleTranslationsRecord<T> = LocaleRecord<T, PartialMessages<T>>;
