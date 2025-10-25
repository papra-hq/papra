import { describe, expect, test } from 'vitest';
import { createDateFormatter, createRelativeTimeFormatter, createTranslator, findMatchingLocale } from './i18n.models';

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

  describe('createDateFormatter', () => {
    test('formats date according to locale, by default in short format', () => {
      expect(
        createDateFormatter({ getLocale: () => 'en' })(new Date('2025-01-15')),
      ).to.eql('Jan 15, 2025');

      expect(
        createDateFormatter({ getLocale: () => 'fr' })(new Date('2025-01-15')),
      ).to.eql('15 janv. 2025');

      expect(
        createDateFormatter({ getLocale: () => 'pt-BR' })(new Date('2025-01-15')),
      ).to.eql('15 de jan. de 2025');
    });
  });

  describe('createRelativeTimeFormatter', () => {
    test('formats relative time according to locale', () => {
      expect(
        createRelativeTimeFormatter({ getLocale: () => 'en' })(new Date('2021-01-01T00:00:00Z'), { now: new Date('2021-01-01T00:00:00Z') }),
      ).to.eql('now');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'en' })(new Date('2021-01-01T00:00:00Z'), { now: new Date('2021-01-01T00:00:06Z') }),
      ).to.eql('6 seconds ago');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'fr' })(new Date('2021-01-01T00:00:00Z'), { now: new Date('2021-01-01T00:02:00Z') }),
      ).to.eql('il y a 2 minutes');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'pt-BR' })(new Date('2021-01-01T00:00:00Z'), { now: new Date('2021-01-03T00:00:00Z') }),
      ).to.eql('anteontem');
    });

    test('use the best unit for relative time', () => {
      const formatter = createRelativeTimeFormatter({ getLocale: () => 'en' });
      const timeAgo = (now: Date) => formatter(new Date('2021-01-01T00:00:00Z'), { now });

      expect(timeAgo(new Date('2021-01-01T00:00:00Z'))).toBe('now');
      expect(timeAgo(new Date('2021-01-01T00:00:06Z'))).toBe('6 seconds ago');
      expect(timeAgo(new Date('2021-01-01T00:01:00Z'))).toBe('1 minute ago');
      expect(timeAgo(new Date('2021-01-01T00:02:00Z'))).toBe('2 minutes ago');
      expect(timeAgo(new Date('2021-01-01T01:00:00Z'))).toBe('1 hour ago');
      expect(timeAgo(new Date('2021-01-01T02:00:00Z'))).toBe('2 hours ago');
      expect(timeAgo(new Date('2021-01-02T00:00:00Z'))).toBe('yesterday');
      expect(timeAgo(new Date('2021-01-03T00:00:00Z'))).toBe('2 days ago');
      expect(timeAgo(new Date('2021-02-01T00:00:00Z'))).toBe('last month');
      expect(timeAgo(new Date('2021-03-02T00:00:00Z'))).toBe('2 months ago');
      expect(timeAgo(new Date('2022-01-12T00:00:00Z'))).toBe('last year');
      expect(timeAgo(new Date('2023-01-01T00:00:00Z'))).toBe('2 years ago');
    });

    test('handles future dates correctly', () => {
      const formatter = createRelativeTimeFormatter({ getLocale: () => 'en' });
      const timeUntil = (now: Date) => formatter(new Date('2021-01-01T00:00:00Z'), { now });

      expect(timeUntil(new Date('2020-12-31T23:59:54Z'))).toBe('in 6 seconds');
      expect(timeUntil(new Date('2020-12-31T23:59:00Z'))).toBe('in 1 minute');
      expect(timeUntil(new Date('2020-12-31T23:58:00Z'))).toBe('in 2 minutes');
      expect(timeUntil(new Date('2020-12-31T23:00:00Z'))).toBe('in 1 hour');
      expect(timeUntil(new Date('2020-12-31T22:00:00Z'))).toBe('in 2 hours');
      expect(timeUntil(new Date('2020-12-31T00:00:00Z'))).toBe('tomorrow');
      expect(timeUntil(new Date('2020-12-30T00:00:00Z'))).toBe('in 2 days');
      expect(timeUntil(new Date('2020-12-01T00:00:00Z'))).toBe('next month');
      expect(timeUntil(new Date('2020-11-01T00:00:00Z'))).toBe('in 2 months');
      expect(timeUntil(new Date('2020-01-01T00:00:00Z'))).toBe('next year');
      expect(timeUntil(new Date('2019-01-01T00:00:00Z'))).toBe('in 2 years');
    });

    test('formats future dates according to locale', () => {
      expect(
        createRelativeTimeFormatter({ getLocale: () => 'en' })(new Date('2021-01-01T00:02:00Z'), { now: new Date('2021-01-01T00:00:00Z') }),
      ).to.eql('in 2 minutes');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'fr' })(new Date('2021-01-01T00:02:00Z'), { now: new Date('2021-01-01T00:00:00Z') }),
      ).to.eql('dans 2 minutes');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'pt-BR' })(new Date('2021-01-03T00:00:00Z'), { now: new Date('2021-01-01T00:00:00Z') }),
      ).to.eql('depois de amanhã');
    });

    test('the date can be a parsable string', () => {
      expect(
        createRelativeTimeFormatter({ getLocale: () => 'en' })('2021-01-01T00:00:00Z', { now: new Date('2021-01-01T00:00:00Z') }),
      ).to.eql('now');

      expect(
        createRelativeTimeFormatter({ getLocale: () => 'en' })('2021-01-01', { now: new Date('2021-01-01T00:02:00Z') }),
      ).to.eql('2 minutes ago');
    });
  });
});
