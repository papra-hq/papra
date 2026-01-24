import { DEFAULT_LOCALE, LOCALES } from './i18n.constants';

export function createRedirectionToLocalizedPage(buildUrl: (args: { locale: string }) => string, { defaultLocale = DEFAULT_LOCALE, locales = LOCALES }: { defaultLocale?: string; locales?: readonly string[] } = {}) {
  return ({ preferredLocaleList = [] }: { preferredLocaleList?: string[] } = {}) => {
    const locale = preferredLocaleList.find(candidateLocale => locales.includes(candidateLocale)) ?? defaultLocale;
    const url = buildUrl({ locale });

    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        Vary: 'Accept-Language',
      },
    });
  };
}
