import { describe, expect, test } from 'vitest';

const rawLocales = import.meta.glob('../../locales/*.yml', { eager: true, query: '?flattened' });
const { en: defaultLocal, ...locales } = Object.fromEntries(
  Object.entries(rawLocales).map(([key, value]: [string, any]) => [key.replace('../../locales/', '').replace('.yml', ''), value.default]),
);

describe('locales', () => {
  for (const [locale, translations] of Object.entries(locales)) {
    describe(locale, () => {
      test(`locale ${locale} must not have extra keys compared to default`, () => {
        const extraKeys = Object
          .keys(translations)
          .filter(key => !(key in defaultLocal));

        expect(extraKeys).to.eql([], `Extra keys found in ${locale}`);
      });

      test(`all translations in ${locale} must be strings`, () => {
        const nonStringTranslations = Object
          .entries(translations)
          .filter(([, value]) => typeof value !== 'string')
          .map(([key]) => key);

        expect(nonStringTranslations).to.eql([], `Non-string translations found in ${locale}`);
      });
    });
  }
});
