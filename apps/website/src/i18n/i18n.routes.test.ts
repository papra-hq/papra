import { describe, expect, test } from 'vitest';
import { createRedirectionToLocalizedPage } from './i18n.routes';

describe('i18n routes', () => {
  describe('createRedirectionToLocalizedPage', () => {
    test('given the user preferences a supported locale, it redirects to that locale', () => {
      const handler = createRedirectionToLocalizedPage(
        ({ locale }) => `/${locale}/test`,
        {
          defaultLocale: 'en',
          locales: ['en', 'fr', 'de'],
        },
      );

      const response = handler({ preferredLocaleList: ['fr', 'en'] });
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/fr/test');
      expect(response.headers.get('Vary')).toBe('Accept-Language');
    });

    test('given the user preferences an unsupported locale, it redirects to the default locale', () => {
      const handler = createRedirectionToLocalizedPage(
        ({ locale }) => `/${locale}/test`,
        {
          defaultLocale: 'en',
          locales: ['en', 'fr', 'de'],
        },
      );

      const response = handler({ preferredLocaleList: ['es', 'it'] });
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/en/test');
      expect(response.headers.get('Vary')).toBe('Accept-Language');
    });

    test('given no user preferences, it redirects to the default locale', () => {
      const handler = createRedirectionToLocalizedPage(
        ({ locale }) => `/${locale}/test`,
        {
          defaultLocale: 'en',
          locales: ['en', 'fr', 'de'],
        },
      );

      const response = handler();
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/en/test');
      expect(response.headers.get('Vary')).toBe('Accept-Language');
    });
  });
});
