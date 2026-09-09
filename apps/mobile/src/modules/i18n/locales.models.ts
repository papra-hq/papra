import type { LocaleKey } from './locales';
import { DEFAULT_LOCALE_KEY, LOCALE_KEYS } from './locales';

export function resolveUserLocale<Key extends string = LocaleKey>(
  userLocales: { languageCode?: string | null; languageTag: string }[],
  {
    defaultLocaleKey = DEFAULT_LOCALE_KEY as Key,
    supportedLocaleKeys = LOCALE_KEYS as Key[],
  }: { defaultLocaleKey?: Key; supportedLocaleKeys?: Key[] } = {},
): Key {
  const localeKeys = new Map(supportedLocaleKeys.map((key) => [key.toLowerCase(), key]));

  for (const userLocale of userLocales) {
    const languageTag = userLocale.languageTag.toLowerCase();

    const matchedLanguageTag = localeKeys.get(languageTag);
    if (matchedLanguageTag) {
      return matchedLanguageTag;
    }

    const languageCode = userLocale.languageCode?.toLowerCase();

    const matchedLanguageCode = languageCode && localeKeys.get(languageCode);
    if (matchedLanguageCode) {
      return matchedLanguageCode;
    }
  }

  return defaultLocaleKey;
}
