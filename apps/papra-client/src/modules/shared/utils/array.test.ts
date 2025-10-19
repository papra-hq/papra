import { describe, expect, test } from 'vitest';
import { castArray } from './array';

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
});
