import { describe, expect, test } from 'vitest';
import { isValidDate } from './date';

describe('date', () => {
  describe('isValidDate', () => {
    test('ensure that a date is valid and there are no parsing issues', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(isValidDate(new Date('2024-01-15T10:30:00'))).toBe(true);

      expect(isValidDate(new Date('invalid-date-string'))).toBe(false);
      expect(isValidDate(new Date(Number.NaN))).toBe(false);
    });
  });
});
