import { describe, expect, test } from 'vitest';
import { booleanishSchema, trustedOriginsSchema } from './config.schemas';

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

  describe('trustedOriginsSchema', () => {
    test('this schema validates and coerces a comma separated string to an array of urls or a literal *', () => {
      expect(trustedOriginsSchema.parse('*')).toEqual('*');
      expect(trustedOriginsSchema.parse('http://localhost:3000')).toEqual(['http://localhost:3000']);
      expect(trustedOriginsSchema.parse('http://localhost:3000,http://localhost:3001')).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
      expect(trustedOriginsSchema.parse([
        'http://localhost:3000',
        'http://localhost:3001',
      ])).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    test('otherwise it throws an error', () => {
      expect(() => trustedOriginsSchema.parse('non-url')).toThrow();
    });
  });
});
