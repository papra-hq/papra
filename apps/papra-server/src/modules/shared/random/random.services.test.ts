import { describe, expect, test } from 'vitest';
import { generateToken } from './random.services';

describe('random', () => {
  describe('generateToken', () => {
    test('create random token of 32 characters by default', () => {
      const { token } = generateToken();

      expect(token.length).toBe(32);
    });

    test('the length can be customized', () => {
      expect(generateToken({ length: 64 }).token.length).toBe(64);
      expect(generateToken({ length: 31 }).token.length).toBe(31);
    });
  });
});
