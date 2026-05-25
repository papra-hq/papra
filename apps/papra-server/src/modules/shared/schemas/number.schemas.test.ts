import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { coercedNumberSchema } from './number.schemas';

describe('number schemas', () => {
  describe('coerceNumberSchema', () => {
    test('validates and coerces a string to a number', () => {
      expect(v.parse(coercedNumberSchema, '42')).toBe(42);
      expect(v.parse(coercedNumberSchema, 42)).toBe(42);

      expect(() => v.parse(coercedNumberSchema, 'not-a-number')).toThrow();
      expect(() => v.parse(coercedNumberSchema, [])).toThrow();
    });
  });
});
