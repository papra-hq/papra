import type { TranslationsDictionary } from './i18n.types';
import { createBranchlet } from '@branchlet/core';
import { joinUrlPaths } from '@corentinth/chisels';
import { translations } from '../locales/index';
import { DEFAULT_LOCALE, LOCALES } from './i18n.constants';

export function getLocaleFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');

  if (lang && (LOCALES as ReadonlyArray<string>).includes(lang)) {
    return lang;
  }

  return DEFAULT_LOCALE;
}

export function getTranslations({ locale }: { locale: string }): TranslationsDictionary {
  const defaultTranslations = translations[DEFAULT_LOCALE] as TranslationsDictionary;

  if (locale === DEFAULT_LOCALE) {
    return defaultTranslations;
  }

  const localeTranslations = (translations as Record<string, typeof defaultTranslations>)[locale] ?? {};

  return {
    ...defaultTranslations,
    ...localeTranslations,
  };
}

const { parse } = createBranchlet();

export function useI18n({ locale = DEFAULT_LOCALE }: { locale?: string } = {}) {
  return {
    locale,
    t: <K extends keyof TranslationsDictionary>(key: K, args?: Record<string, string | number>): TranslationsDictionary[K] => {
      const translations = getTranslations({ locale });
      const template = translations[key] ?? key;

      if (typeof template !== 'string') {
        return template;
      }

      return parse(template, args) as TranslationsDictionary[K];
    },
  };
}

export type Translator = ReturnType<typeof useI18n>['t'];

export function getPathWithoutLocale(url: URL | string) {
  const pathname = typeof url === 'string' ? url : url.pathname;

  // remove first / if exists
  const trimmedPathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const [firstSegment, ...rest] = trimmedPathname.split('/');

  if (firstSegment && (LOCALES as ReadonlyArray<string>).includes(firstSegment)) {
    return `/${rest.join('/')}`;
  }

  return pathname;
}

export function buildLocalizedPath({ locale = DEFAULT_LOCALE, path }: { locale?: string; path: string }) {
  return `/${joinUrlPaths(locale, path)}`;
}
