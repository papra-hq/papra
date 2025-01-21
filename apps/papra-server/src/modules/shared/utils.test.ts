import { describe, expect, test } from 'vitest';
import { omitUndefined } from './utils';

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
});
