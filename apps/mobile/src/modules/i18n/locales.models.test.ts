import { describe, expect, test } from 'vitest';
import { resolveUserLocale } from './locales.models';

describe('locales.models', () => {
  describe('resolveUserLocale', () => {
    test('when a user locale matches a supported locale key, it returns that key', () => {
      expect(
        resolveUserLocale([{ languageTag: 'en' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('en');

      expect(
        resolveUserLocale([{ languageTag: 'fr' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('fr');
    });

    test('when a user locale does not match any supported locale key, it returns the default locale key', () => {
      expect(
        resolveUserLocale([{ languageTag: 'es' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('en');
    });

    test('when a user locale matches a supported locale key by language code, it returns that key', () => {
      expect(
        resolveUserLocale([{ languageCode: 'en', languageTag: 'en-US' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('en');
    });

    test('the locale keys are matched case-insensitively', () => {
      expect(
        resolveUserLocale([{ languageTag: 'EN' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('en');

      expect(
        resolveUserLocale([{ languageTag: 'FR' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('fr');

      expect(
        resolveUserLocale([{ languageCode: 'FR', languageTag: 'fr-FR' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('fr');
    });

    test('language tag takes precedence over language code when both are present', () => {
      expect(
        resolveUserLocale([{ languageCode: 'fr', languageTag: 'en' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('en');

      expect(
        resolveUserLocale([{ languageCode: 'en', languageTag: 'fr' }], {
          supportedLocaleKeys: ['en', 'fr'],
          defaultLocaleKey: 'en',
        }),
      ).to.eql('fr');
    });
  });
});
