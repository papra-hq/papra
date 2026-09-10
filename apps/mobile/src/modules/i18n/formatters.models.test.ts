import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDateFormatter } from './formatters.models';

// Use a local date so default-format tests do not depend on the machine's timezone.
const date = new Date(2025, 0, 15, 12);

describe('createDateFormatter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    { locale: 'en-US', expected: 'Jan 15, 2025' },
    { locale: 'en-GB', expected: '15 Jan 2025' },
    { locale: 'fr-CA', expected: '15 janv. 2025' },
    { locale: 'it-IT', expected: '15 gen 2025' },
  ])('formats dates using the full $locale tag', ({ locale, expected }) => {
    expect(createDateFormatter({ locale })(date)).to.eql(expected);
  });

  test('custom options replace the default date fields', () => {
    const formatDate = createDateFormatter({ locale: 'en-GB' });

    expect(formatDate(date, { year: 'numeric' })).to.eql('2025');
    expect(formatDate(date, { dateStyle: 'short' })).to.eql('15/01/2025');
    expect(formatDate(date, { timeStyle: 'short' })).to.eql('12:00');
    expect(formatDate(date)).to.eql('15 Jan 2025');
  });

  test('timestamps use the local timezone unless explicitly overridden', () => {
    const formatDate = createDateFormatter({ locale: 'en-GB' });
    const timestamp = new Date('2025-01-15T00:30:00Z');

    expect(formatDate(timestamp)).to.eql(
      new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(timestamp),
    );
    expect(formatDate(timestamp, { dateStyle: 'short', timeZone: 'UTC' })).to.eql('15/01/2025');
    expect(formatDate(timestamp, { dateStyle: 'short', timeZone: 'America/Los_Angeles' })).to.eql(
      '14/01/2025',
    );
  });

  test('reuses the default Intl formatter across calls', () => {
    const DateTimeFormat = Intl.DateTimeFormat;
    const dateTimeFormat = vi
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(function (locales, options) {
        return new DateTimeFormat(locales, options);
      });
    const formatDate = createDateFormatter({ locale: 'en-GB' });

    formatDate(date);
    formatDate(new Date(2025, 0, 16, 12));

    expect(dateTimeFormat).toHaveBeenCalledTimes(1);
  });
});
