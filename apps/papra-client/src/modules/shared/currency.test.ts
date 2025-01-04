import { describe, expect, test } from 'vitest';
import { formatAmountInCents } from './currency';

describe('currency', () => {
  describe('formatAmountInCents', () => {
    test('formats amount in cents to human readable format with currency symbol, by default USD', () => {
      expect(formatAmountInCents({ amountInCents: 1000 })).toBe('$10.00');
      expect(formatAmountInCents({ amountInCents: 100000 })).toBe('$1,000.00');
      expect(formatAmountInCents({ amountInCents: 1234.5 })).toBe('$12.35');
    });

    test('the currency can be changed', () => {
      expect(formatAmountInCents({ amountInCents: 1000, currency: 'EUR' })).toBe('€10.00');
      expect(formatAmountInCents({ amountInCents: 1000, currency: 'JPY' })).toBe('¥10.00');
      expect(formatAmountInCents({ amountInCents: 1000, currency: 'GBP' })).toBe('£10.00');
    });
  });
});
