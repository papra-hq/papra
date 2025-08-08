import { describe, expect, test } from 'vitest';
import { createTranslator, findMatchingLocale } from './i18n.models';

describe('i18n models', () => {
  describe('findMatchingLocale', () => {
    test('preferred regional language to regional language', () => {
      const preferredLocales = ['pt-BR'].map(x => new Intl.Locale(x));
      const supportedLocales = ['en', 'pt-BR'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('pt-BR');
    });

    test('preferred non-regional language to non-regional language', () => {
      const preferredLocales = ['pt'].map(x => new Intl.Locale(x));
      const supportedLocales = ['pt-BR', 'pt'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('pt');
    });

    test('preferred regional language to non-regional language', () => {
      const preferredLocales = ['en-GB'].map(x => new Intl.Locale(x));
      const supportedLocales = ['pt-BR', 'en'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('en');
    });

    test('preferred language with different region to supported language', () => {
      const preferredLocales = ['en-CA'].map(x => new Intl.Locale(x));
      const supportedLocales = ['fr-FR', 'en-US'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('en-US');
    });

    test('preferred language not in supported locales', () => {
      const preferredLocales = ['it-IT'].map(x => new Intl.Locale(x));
      const supportedLocales = ['es-ES', 'de-DE'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('en');
    });

    test('empty preferred locales', () => {
      const preferredLocales: Intl.Locale[] = [];
      const supportedLocales = ['en', 'pt-BR'].map(x => new Intl.Locale(x));
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('en');
    });

    test('empty supported locales', () => {
      const preferredLocales = ['en-GB', 'pt-BR'].map(x => new Intl.Locale(x));
      const supportedLocales: Intl.Locale[] = [];
      const locale = findMatchingLocale({ preferredLocales, supportedLocales });

      expect(locale).to.eql('en');
    });
  });

  describe('createTranslator', () => {
    test('it build a function that return the value of a key in the provided dictionary', () => {
      const dictionary = {
        hello: 'Hello!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello')).to.eql('Hello!');
    });

    test('the translator returns undefined if the key is not in the dictionary', () => {
      const dictionary = {
        hello: 'Hello!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('world' as any)).to.eql(undefined);
      expect(t('world' as any, { name: 'John' })).to.eql(undefined);
    });

    test('the translator replaces the placeholders in the translation', () => {
      const dictionary = {
        hello: 'Hello, {{ name }}!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello', { name: 'John' })).to.eql('Hello, John!');
    });

    test('the translator replaces all occurrences of the placeholder', () => {
      const dictionary = {
        hello: 'Hello, {{ name }}! How are you, {{ name }}?',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello', { name: 'John' })).to.eql('Hello, John! How are you, John?');
    });

    test('the translator replaces multiple placeholders', () => {
      const dictionary = {
        hello: 'Hello, {{ name }} {{ surname }}!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello', { name: 'John', surname: 'Doe' })).to.eql('Hello, John Doe!');
    });

    test('when no value is provided for a placeholder, it keeps the placeholder', () => {
      const dictionary = {
        hello: 'Hello, {{ name }}!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello')).to.eql('Hello, {{ name }}!');
    });

    test('the spaces around the placeholder are optional', () => {
      const dictionary = {
        hello: '{{name}}, {{ name }}, {{ name}} and {{      name      }}!',
      };
      const t = createTranslator({ getDictionary: () => dictionary });

      expect(t('hello', { name: 'John' })).to.eql('John, John, John and John!');
    });
  });
});
