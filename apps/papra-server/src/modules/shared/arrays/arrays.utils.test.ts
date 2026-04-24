import { describe, expect, test } from 'vitest';
import { ensureNonEmptyArray, isNonEmptyArray } from './arrays.utils';

describe('arrays.utils', () => {
  describe('ensureNonEmptyArray', () => {
    describe('helper mainly used for type inference', () => {
      test('throws an error if the array is nil or empty', () => {
        expect(() => ensureNonEmptyArray(undefined)).toThrow('Expected a non-empty array');
        expect(() => ensureNonEmptyArray([])).toThrow('Expected a non-empty array');
        expect(() => ensureNonEmptyArray(null)).toThrow('Expected a non-empty array');

        expect(ensureNonEmptyArray([1, 2, 3])).toEqual([1, 2, 3]);
        expect(ensureNonEmptyArray(['a', 'b'])).toEqual(['a', 'b']);
      });
    });
  });

  describe('isNonEmptyArray', () => {
    describe('helper mainly used for type inference', () => {
      test('returns true if the array is non-empty and not nil', () => {
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(isNonEmptyArray(['a', 'b'])).toBe(true);

        expect(isNonEmptyArray([])).toBe(false);
        expect(isNonEmptyArray(undefined)).toBe(false);
        expect(isNonEmptyArray(null)).toBe(false);
      });
    });
  });
});
