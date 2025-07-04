import { describe, expect, test } from 'vitest';
import { isDefined, isNil, omitUndefined } from './utils';

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
});
