import { describe, expect, test } from 'vitest';
import { addDays, isValidDate, startOfDay, subDays } from './date';

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

  describe('addDays', () => {
    describe('add days to a date, taking care of month/year boundaries', () => {
      test('in the same month', () => {
        expect(addDays(new Date('2024-05-10'), 5)).to.eql(new Date('2024-05-15'));
      });

      test('across month boundary', () => {
        expect(addDays(new Date('2024-04-30'), 1)).to.eql(new Date('2024-05-01')); // 30 days in April
        expect(addDays(new Date('2024-05-31'), 1)).to.eql(new Date('2024-06-01')); // 31 days in May
        expect(addDays(new Date('2024-02-29'), 1)).to.eql(new Date('2024-03-01')); // leap year
        expect(addDays(new Date('2023-02-28'), 1)).to.eql(new Date('2023-03-01')); // non-leap year
      });

      test('across year boundary', () => {
        expect(addDays(new Date('2023-12-31'), 1)).to.eql(new Date('2024-01-01'));
      });

      test('adding zero days returns the same date', () => {
        expect(addDays(new Date('2024-05-15'), 0)).to.eql(new Date('2024-05-15'));
      });

      test('adding negative days subtracts days', () => {
        expect(addDays(new Date('2024-05-20'), -5)).to.eql(new Date('2024-05-15'));
      });

      test('large number of days', () => {
        expect(addDays(new Date('2024-05-15'), 365)).to.eql(new Date('2025-05-15'));
        expect(addDays(new Date('2023-03-01'), 366)).to.eql(new Date('2024-03-01')); // leap year included
        expect(addDays(new Date('2021-10-23'), 800)).to.eql(new Date('2024-01-01'));
      });
    });
  });

  describe('subDays', () => {
    describe('subtract days from a date, taking care of month/year boundaries', () => {
      test('in the same month', () => {
        expect(subDays(new Date('2024-05-15'), 5)).to.eql(new Date('2024-05-10'));
      });

      test('across month boundary', () => {
        expect(subDays(new Date('2024-05-01'), 1)).to.eql(new Date('2024-04-30')); // 30 days in April
        expect(subDays(new Date('2024-06-01'), 1)).to.eql(new Date('2024-05-31')); // 31 days in May
        expect(subDays(new Date('2024-03-01'), 1)).to.eql(new Date('2024-02-29')); // leap year
        expect(subDays(new Date('2023-03-01'), 1)).to.eql(new Date('2023-02-28')); // non-leap year
      });

      test('across year boundary', () => {
        expect(subDays(new Date('2024-01-01'), 1)).to.eql(new Date('2023-12-31'));
      });

      test('subtracting zero days returns the same date', () => {
        expect(subDays(new Date('2024-05-15'), 0)).to.eql(new Date('2024-05-15'));
      });

      test('subtracting negative days adds days', () => {
        expect(subDays(new Date('2024-05-15'), -5)).to.eql(new Date('2024-05-20'));
      });

      test('large number of days', () => {
        expect(subDays(new Date('2025-05-15'), 365)).to.eql(new Date('2024-05-15'));
        expect(subDays(new Date('2024-03-01'), 366)).to.eql(new Date('2023-03-01')); // leap year included
        expect(subDays(new Date('2024-01-01'), 800)).to.eql(new Date('2021-10-23'));
      });

      test('keeps the time component unchanged', () => {
        expect(subDays(new Date('2024-05-15T10:30:45'), 5)).to.eql(new Date('2024-05-10T10:30:45'));
        expect(subDays(new Date('2024-01-01T10:30:45'), 800)).to.eql(new Date('2021-10-23T10:30:45'));
      });
    });
  });

  describe('startOfDay', () => {
    test('sets the time to the start of the day', () => {
      expect(startOfDay(new Date('2024-05-15T10:30:45'))).to.eql(new Date('2024-05-15T00:00:00'));
    });
  });
});
