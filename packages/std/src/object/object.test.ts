import { describe, expect, test } from 'vitest';
import { mapValues } from './object';

describe('object', () => {
  describe('mapValues', () => {
    test('typesafely maps values of an object', () => {
      expect(mapValues({ a: 1, b: 2 }, (value) => value * 2)).to.eql({ a: 2, b: 4 });
    });
  });
});
