import { describe, expect, test } from 'vitest';
import { resolveSetterValue } from './setters';

describe('setters', () => {
  describe('resolveSetterValue', () => {
    test('helps resolve a solidjs setter value, which can be either a direct value or an updater function', () => {
      expect(resolveSetterValue(5, 0)).toBe(5);
      expect(resolveSetterValue((prev: number) => prev + 1, 5)).toBe(6);
    });
  });
});
