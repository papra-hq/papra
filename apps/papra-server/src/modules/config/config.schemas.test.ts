import { describe, expect, test } from 'vitest';
import { booleanishSchema } from './config.schemas';

describe('config schemas', () => {
  describe('booleanishSchema', () => {
    test('a zod schema that validates and coerces a string to a boolean, used in the config where we accept env variables and pojo values', () => {
      expect(booleanishSchema.parse(true)).toBe(true);
      expect(booleanishSchema.parse('true')).toBe(true);
      expect(booleanishSchema.parse('TRUE')).toBe(true);
      expect(booleanishSchema.parse('True')).toBe(true);
      expect(booleanishSchema.parse(' True ')).toBe(true);
      expect(booleanishSchema.parse('1')).toBe(true);
      expect(booleanishSchema.parse(1)).toBe(true);

      expect(booleanishSchema.parse('false')).toBe(false);
      expect(booleanishSchema.parse('FALSE')).toBe(false);
      expect(booleanishSchema.parse('False')).toBe(false);
      expect(booleanishSchema.parse(' False ')).toBe(false);
      expect(booleanishSchema.parse(false)).toBe(false);
      expect(booleanishSchema.parse('foo')).toBe(false);
      expect(booleanishSchema.parse('0')).toBe(false);
      expect(booleanishSchema.parse(-1)).toBe(false);
      expect(booleanishSchema.parse(0)).toBe(false);
      expect(booleanishSchema.parse(2)).toBe(false);
    });
  });
});
