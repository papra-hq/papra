import type { JSX } from 'solid-js';
import type { Locale } from './i18n.provider';

// This tries to get the most preferred language compatible with the supported languages
// It tries to find a supported language by comparing both region and language, if not, then just language
// For example:
// en-GB -> en
// pt-BR -> pt-BR
export function findMatchingLocale({
  preferredLocales,
  supportedLocales,
}: {
  preferredLocales: Intl.Locale[];
  supportedLocales: Intl.Locale[];
}) {
  for (const locale of preferredLocales) {
    const localeMatchRegion = supportedLocales.find(x => x.baseName === locale.baseName);

    if (localeMatchRegion) {
      return localeMatchRegion.baseName as Locale;
    }

    const localeMatchLanguage = supportedLocales.find(x => x.language === locale.language);
    if (localeMatchLanguage) {
      return localeMatchLanguage.baseName as Locale;
    }
  }
  return 'en';
}

export function createTranslator<Dict extends Record<string, string>>({ getDictionary }: { getDictionary: () => Dict }) {
  return (key: keyof Dict, args?: Record<string, string | number>) => {
    const translationFromDictionary = getDictionary()[key];

    if (!translationFromDictionary && import.meta.env.DEV) {
      console.warn(`Translation not found for key: ${String(key)}`);
    }

    if (args && translationFromDictionary) {
      return Object.entries(args)
        .reduce(
          (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
          String(translationFromDictionary),
        );
    }

    return translationFromDictionary;
  };
}

export function createFragmentTranslator<Dict extends Record<string, string>>({ getDictionary }: { getDictionary: () => Dict }) {
  return (key: keyof Dict, args?: Record<string, JSX.Element>) => {
    const translation: string = getDictionary()[key] ?? key;

    if (args) {
      const fragments: JSX.Element[] = [];

      const parts = translation.split(/(\{\{[^}]+\}\})/g);

      for (const part of parts) {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const key = part.slice(2, -2).trim();
          fragments.push(args[key]);
        } else {
          fragments.push(part);
        }
      }

      return fragments;
    }

    return translation;
  };
}
