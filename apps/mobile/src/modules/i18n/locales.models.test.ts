import { describe, expect, test } from 'vitest';
import { resolveUserLocale } from './locales.models';

describe('locales.models', () => {
  describe('resolveUserLocale', () => {
    const localeConfig = {
      supportedLocaleKeys: ['en', 'fr'],
      defaultLocaleKey: 'en',
    };

    test('when a user locale matches a supported locale key, it returns that key', () => {
      expect(resolveUserLocale([{ languageTag: 'en' }], localeConfig)).to.eql('en');

      expect(resolveUserLocale([{ languageTag: 'fr' }], localeConfig)).to.eql('fr');
    });

    test('when a user locale does not match any supported locale key, it returns the default locale key', () => {
      expect(resolveUserLocale([{ languageTag: 'es' }], localeConfig)).to.eql('en');
    });

    test('it checks the device languages in preference order, skipping unsupported languages', () => {
      expect(
        resolveUserLocale(
          [
            { languageCode: 'de', languageTag: 'de-DE' },
            { languageCode: 'fr', languageTag: 'fr-CA' },
            { languageCode: 'en', languageTag: 'en-US' },
          ],
          localeConfig,
        ),
      ).to.eql('fr');
    });

    test('it falls back to English when the device has no supported languages', () => {
      expect(
        resolveUserLocale([{ languageCode: 'de', languageTag: 'de-DE' }], localeConfig),
      ).to.eql('en');
      expect(
        resolveUserLocale([], { supportedLocaleKeys: ['en', 'fr'], defaultLocaleKey: 'en' }),
      ).to.eql('en');
    });

    test('when a user locale matches a supported locale key by language code, it returns that key', () => {
      expect(
        resolveUserLocale([{ languageCode: 'en', languageTag: 'en-US' }], localeConfig),
      ).to.eql('en');
    });

    test('the locale keys are matched case-insensitively', () => {
      expect(resolveUserLocale([{ languageTag: 'EN' }], localeConfig)).to.eql('en');

      expect(resolveUserLocale([{ languageTag: 'FR' }], localeConfig)).to.eql('fr');

      expect(
        resolveUserLocale([{ languageCode: 'FR', languageTag: 'fr-FR' }], localeConfig),
      ).to.eql('fr');
    });

    test('language tag takes precedence over language code when both are present', () => {
      expect(resolveUserLocale([{ languageCode: 'fr', languageTag: 'en' }], localeConfig)).to.eql(
        'en',
      );

      expect(resolveUserLocale([{ languageCode: 'en', languageTag: 'fr' }], localeConfig)).to.eql(
        'fr',
      );
    });
  });
});
