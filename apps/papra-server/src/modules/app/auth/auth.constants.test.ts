import { describe, expect, test } from 'vitest';
import { DEFAULT_AUTH_SECRET } from './auth.constants';

describe('auth constants', () => {
  describe('default auth secret', () => {
    test('the default auth secret should be at least 32 characters long', () => {
      expect(DEFAULT_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    });
  });
});
