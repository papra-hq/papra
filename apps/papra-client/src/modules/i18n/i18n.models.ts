import type { JSX } from 'solid-js';
import type { CoercibleDate } from '../shared/date/date.types';
import type { Locale } from './i18n.provider';
import { createBranchlet } from '@branchlet/core';
import { coerceDate } from '../shared/date/coerce-date';
import { IN_MS } from '../shared/utils/units';

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
  const { parse } = createBranchlet();

  return (key: keyof Dict, args?: Record<string, string | number>) => {
    const translationFromDictionary = getDictionary()[key];

    if (!translationFromDictionary && import.meta.env.DEV) {
      console.warn(`Translation not found for key: ${String(key)}`);
    }

    if (args && translationFromDictionary) {
      return parse(translationFromDictionary, args);
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

export function createDateFormatter({ getLocale }: { getLocale: () => string }) {
  return (date: CoercibleDate, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    return new Intl.DateTimeFormat(getLocale(), options).format(coerceDate(date));
  };
}

export function createRelativeTimeFormatter({ getLocale }: { getLocale: () => string }) {
  return (rawDate: CoercibleDate, { now = new Date(), numeric = 'auto', style = 'long' }: { now?: Date; numeric?: 'auto' | 'always'; style?: 'long' | 'short' } = {}) => {
    const formatter = new Intl.RelativeTimeFormat(getLocale(), { numeric, style });

    const date = coerceDate(rawDate);
    const msDiff = now.getTime() - date.getTime();
    const absDiff = Math.abs(msDiff);
    const sign = msDiff >= 0 ? -1 : 1;

    if (absDiff < IN_MS.MINUTE) {
      return formatter.format(sign * Math.round(absDiff / 1_000), 'second');
    }

    if (absDiff < IN_MS.HOUR) {
      return formatter.format(sign * Math.round(absDiff / IN_MS.MINUTE), 'minute');
    }

    if (absDiff < IN_MS.DAY) {
      return formatter.format(sign * Math.round(absDiff / IN_MS.HOUR), 'hour');
    }

    if (absDiff < IN_MS.WEEK) {
      return formatter.format(sign * Math.round(absDiff / IN_MS.DAY), 'day');
    }

    if (absDiff < IN_MS.MONTH) {
      return formatter.format(sign * Math.round(absDiff / IN_MS.WEEK), 'week');
    }

    if (absDiff < IN_MS.YEAR) {
      return formatter.format(sign * Math.round(absDiff / IN_MS.MONTH), 'month');
    }

    return formatter.format(sign * Math.round(absDiff / IN_MS.YEAR), 'year');
  };
}
