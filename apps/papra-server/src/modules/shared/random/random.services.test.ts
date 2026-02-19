import { describe, expect, test } from 'vitest';
import { generateRandomString } from './random.services';

describe('random', () => {
  describe('generateRandomString', () => {
    test('create random string of 32 characters by default', () => {
      expect(generateRandomString().length).toBe(32);
    });

    test('the length can be customized', () => {
      expect(generateRandomString({ length: 64 }).length).toBe(64);
      expect(generateRandomString({ length: 31 }).length).toBe(31);
    });
  });
});
