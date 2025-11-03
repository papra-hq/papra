import { describe, expect, test } from 'vitest';
import { booleanishSchema, trustedAppSchemeSchema, trustedOriginsSchema } from './config.schemas';

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
    test('this schema validates and coerces a comma separated string to an array of urls', () => {
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

  describe('trustedAppSchemeSchema', () => {
    test('validates app schemes ending with ://', () => {
      expect(trustedAppSchemeSchema.parse('papra://')).toBe('papra://');
      expect(trustedAppSchemeSchema.parse('exp://')).toBe('exp://');
      expect(trustedAppSchemeSchema.parse('my-app+test://')).toBe('my-app+test://');

      expect(() => trustedAppSchemeSchema.parse('invalid-scheme')).toThrow();
      expect(() => trustedAppSchemeSchema.parse('http:/')).toThrow();
      expect(() => trustedAppSchemeSchema.parse('papra://foo')).toThrow();
      expect(() => trustedAppSchemeSchema.parse('papra-://')).toThrow();
      expect(() => trustedAppSchemeSchema.parse('papra+://')).toThrow();
      expect(() => trustedAppSchemeSchema.parse('://')).toThrow();
    });
  });
});
