import { describe, expect, it } from 'vitest';
import { formatDateToInputString, parseDateInput } from './date-input';

describe('date-input utils', () => {
  describe('formatDateToInputString', () => {
    it('returns empty string when date is null or undefined', () => {
      expect(formatDateToInputString(null)).toBe('');
      expect(formatDateToInputString(undefined)).toBe('');
    });

    it('returns empty string when date is invalid', () => {
      expect(formatDateToInputString(new Date('invalid'))).toBe('');
    });

    it('formats a date to YYYY-MM-DD correctly', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      expect(formatDateToInputString(date)).toBe('2024-03-15');
    });

    it('pads single-digit month and day with zeros', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(formatDateToInputString(date)).toBe('2025-01-05');
    });

    it('formats historical dates older than 1976 correctly', () => {
      const date1920 = new Date(1920, 4, 8); // May 8, 1920
      date1920.setFullYear(1920);
      expect(formatDateToInputString(date1920)).toBe('1920-05-08');

      const date1850 = new Date(1850, 6, 4); // July 4, 1850
      date1850.setFullYear(1850);
      expect(formatDateToInputString(date1850)).toBe('1850-07-04');
    });
  });

  describe('parseDateInput', () => {
    it('returns null for empty or whitespace-only strings', () => {
      expect(parseDateInput('')).toBeNull();
      expect(parseDateInput('   ')).toBeNull();
    });

    it('parses valid YYYY-MM-DD dates', () => {
      const result = parseDateInput('2024-11-20');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getDate()).toBe(20);
    });

    it('parses historical dates older than 1976', () => {
      const date1950 = parseDateInput('1950-06-15');
      expect(date1950?.getFullYear()).toBe(1950);
      expect(date1950?.getMonth()).toBe(5);
      expect(date1950?.getDate()).toBe(15);

      const date1920 = parseDateInput('1920-01-01');
      expect(date1920?.getFullYear()).toBe(1920);
      expect(date1920?.getMonth()).toBe(0);
      expect(date1920?.getDate()).toBe(1);

      const date1800 = parseDateInput('1800-12-25');
      expect(date1800?.getFullYear()).toBe(1800);
      expect(date1800?.getMonth()).toBe(11);
      expect(date1800?.getDate()).toBe(25);
    });

    it('supports slash and dot separators', () => {
      const slashDate = parseDateInput('1945/05/08');
      expect(slashDate?.getFullYear()).toBe(1945);
      expect(slashDate?.getMonth()).toBe(4);
      expect(slashDate?.getDate()).toBe(8);

      const dotDate = parseDateInput('1939.09.01');
      expect(dotDate?.getFullYear()).toBe(1939);
      expect(dotDate?.getMonth()).toBe(8);
      expect(dotDate?.getDate()).toBe(1);
    });

    it('handles single-digit month and day', () => {
      const result = parseDateInput('1960-3-9');
      expect(result?.getFullYear()).toBe(1960);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(9);
    });

    it('rejects dates with 2-digit or 3-digit year', () => {
      expect(parseDateInput('24-03-15')).toBeNull();
      expect(parseDateInput('999-01-01')).toBeNull();
    });

    it('rejects invalid day in month', () => {
      expect(parseDateInput('2024-02-31')).toBeNull();
      expect(parseDateInput('2023-02-29')).toBeNull(); // not a leap year
      expect(parseDateInput('1900-02-29')).toBeNull(); // 1900 was not a leap year
      expect(parseDateInput('2024-04-31')).toBeNull();
    });

    it('accepts leap day on leap years', () => {
      const leapDate2024 = parseDateInput('2024-02-29');
      expect(leapDate2024?.getFullYear()).toBe(2024);
      expect(leapDate2024?.getMonth()).toBe(1);
      expect(leapDate2024?.getDate()).toBe(29);

      const leapDate2000 = parseDateInput('2000-02-29');
      expect(leapDate2000?.getFullYear()).toBe(2000);
      expect(leapDate2000?.getMonth()).toBe(1);
      expect(leapDate2000?.getDate()).toBe(29);
    });

    it('rejects invalid month numbers', () => {
      expect(parseDateInput('2024-00-15')).toBeNull();
      expect(parseDateInput('2024-13-15')).toBeNull();
    });

    it('parses valid ISO format dates in fallback branch', () => {
      const isoDate = parseDateInput('2024-02-29T12:00:00Z');
      expect(isoDate).not.toBeNull();
      expect(isoDate?.getFullYear()).toBe(2024);
      expect(isoDate?.getMonth()).toBe(1);
      expect(isoDate?.getDate()).toBe(29);
    });

    it('rejects impossible dates in fallback ISO format (such as Feb 30)', () => {
      expect(parseDateInput('2024-02-30T00:00:00Z')).toBeNull();
      expect(parseDateInput('2023-02-29T10:00:00Z')).toBeNull();
      expect(parseDateInput('2024-04-31T00:00:00Z')).toBeNull();
    });

    it('parses valid text format dates in fallback branch', () => {
      const textDate = parseDateInput('February 29, 2024');
      expect(textDate).not.toBeNull();
      expect(textDate?.getFullYear()).toBe(2024);
      expect(textDate?.getMonth()).toBe(1);
      expect(textDate?.getDate()).toBe(29);

      const marchDate = parseDateInput('March 15 2024');
      expect(marchDate?.getFullYear()).toBe(2024);
      expect(marchDate?.getMonth()).toBe(2);
      expect(marchDate?.getDate()).toBe(15);
    });

    it('rejects impossible dates in text format (such as February 30)', () => {
      expect(parseDateInput('February 30, 2024')).toBeNull();
      expect(parseDateInput('February 29, 2023')).toBeNull();
      expect(parseDateInput('April 31, 2024')).toBeNull();
    });

    it('rejects single year numbers and non-date strings in fallback', () => {
      expect(parseDateInput('2024')).toBeNull();
      expect(parseDateInput('hello world')).toBeNull();
      expect(parseDateInput('random-text-here')).toBeNull();
    });
  });
});
