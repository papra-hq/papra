import { describe, expect, test } from 'vitest';
import { isDefined, isNil, isNilOrEmptyString, isNonEmptyString, isString, nullifyPositiveInfinity, omitUndefined, uniq, uniqBy } from './utils';

describe('utils', () => {
  describe('omitUndefined', () => {
    test('removes root undefined values and keeps the rest', () => {
      expect(
        omitUndefined({
          a: 1,
          b: undefined,
          c: 3,
          d: null,
          e: { f: undefined, g: 2 },
          f: '',
        }),
      ).toEqual({
        a: 1,
        c: 3,
        d: null,
        e: { f: undefined, g: 2 },
        f: '',
      });
    });
  });

  describe('isNil', () => {
    test('a value is considered nil if it is either undefined or null', () => {
      expect(isNil(undefined)).toBe(true);
      expect(isNil(null)).toBe(true);

      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
      expect(isNil(false)).toBe(false);
      expect(isNil({})).toBe(false);
      expect(isNil([])).toBe(false);
    });
  });

  describe('isDefined', () => {
    test('a value is considered defined if it is not undefined or null', () => {
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(null)).toBe(false);

      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });
  });

  describe('isString', () => {
    test('returns true if the value is a string', () => {
      expect(isString('')).toBe(true);
      expect(isString('foo')).toBe(true);
      expect(isString(String(1))).toBe(true);
    });

    test('returns false if the value is not a string', () => {
      expect(isString(undefined)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(0)).toBe(false);
      expect(isString(false)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    test('returns true if the value is a non-empty string', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('foo')).toBe(true);
      expect(isNonEmptyString(String(1))).toBe(true);
    });

    test('returns false if the value is not a non-empty string', () => {
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(0)).toBe(false);
      expect(isNonEmptyString(false)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
    });
  });

  describe('nullifyPositiveInfinity', () => {
    test('returns null if the value is positive infinity', () => {
      expect(nullifyPositiveInfinity(Number.POSITIVE_INFINITY)).to.eql(null);
      expect(nullifyPositiveInfinity(42)).to.eql(42);
      expect(nullifyPositiveInfinity(0)).to.eql(0);
      expect(nullifyPositiveInfinity(-42)).to.eql(-42);
      expect(nullifyPositiveInfinity(Number.NEGATIVE_INFINITY)).to.eql(Number.NEGATIVE_INFINITY);
    });
  });

  describe('isNilOrEmptyString', () => {
    test('returns true for undefined, null, or empty string', () => {
      expect(isNilOrEmptyString(undefined)).toBe(true);
      expect(isNilOrEmptyString(null)).toBe(true);
      expect(isNilOrEmptyString('')).toBe(true);
    });

    test('returns false for non-empty strings and other types', () => {
      expect(isNilOrEmptyString('foo')).toBe(false);
      expect(isNilOrEmptyString(0)).toBe(false);
      expect(isNilOrEmptyString(false)).toBe(false);
      expect(isNilOrEmptyString({})).toBe(false);
      expect(isNilOrEmptyString([])).toBe(false);
    });
  });

  describe('uniq', () => {
    test('returns an array with unique values', () => {
      expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(uniq(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
      expect(uniq([])).toEqual([]);
    });
  });

  describe('uniqBy', () => {
    test('returns an array with unique values based on an extracted key', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' },
        { id: 2, name: 'Bob' },
      ];

      const result = uniqBy(data, item => item.id);

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]);
    });
  });
});
