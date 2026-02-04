import { describe, expect, test } from 'vitest';
import { castArray, toArrayIf } from './array';

describe('array', () => {
  describe('castArray', () => {
    test('wraps non-array values in an array', () => {
      expect(castArray(5)).toEqual([5]);
      expect(castArray('hello')).toEqual(['hello']);
      expect(castArray({ key: 'value' })).toEqual([{ key: 'value' }]);
    });

    test('returns the same array if an array is provided', () => {
      expect(castArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(castArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(castArray([])).toEqual([]);

      const objArray = [{ key: 'value1' }, { key: 'value2' }];
      expect(castArray(objArray)).toEqual(objArray);
    });
  });

  describe('toArrayIf', () => {
    test('simple helper to conditionally add stuff to an array', () => {
      const array = [
        ...toArrayIf(true, 'a'),
        ...toArrayIf(false, 'b'),
        ...toArrayIf(true, 'c'),
      ];

      expect(array).toEqual(['a', 'c']);
    });

    test('returns an empty array when condition is false', () => {
      expect(toArrayIf(false, 42)).toEqual([]);
    });

    test('returns an array with the value when condition is true', () => {
      expect(toArrayIf(true, 42)).toEqual([42]);
    });
  });
});
