import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { appSchemeSchema, booleanishSchema, coercedUrlListSchema } from './config.schemas';

describe('config schemas', () => {
  describe('booleanishSchema', () => {
    test('validates and coerces a string to a boolean, used in the config where we accept env variables or js values', () => {
      expect(v.parse(booleanishSchema, true)).toBe(true);
      expect(v.parse(booleanishSchema, 'true')).toBe(true);
      expect(v.parse(booleanishSchema, 'TRUE')).toBe(true);
      expect(v.parse(booleanishSchema, 'True')).toBe(true);
      expect(v.parse(booleanishSchema, ' True ')).toBe(true);
      expect(v.parse(booleanishSchema, '1')).toBe(true);

      expect(v.parse(booleanishSchema, 'false')).toBe(false);
      expect(v.parse(booleanishSchema, 'FALSE')).toBe(false);
      expect(v.parse(booleanishSchema, 'False')).toBe(false);
      expect(v.parse(booleanishSchema, ' False ')).toBe(false);
      expect(v.parse(booleanishSchema, false)).toBe(false);
      expect(v.parse(booleanishSchema, '0')).toBe(false);

      expect(() => v.parse(booleanishSchema, 'foo')).toThrow('Expected a boolean or a string that can be parsed as a boolean');
      expect(() => v.parse(booleanishSchema, 1)).toThrow('Expected a boolean or a string that can be parsed as a boolean');
      expect(() => v.parse(booleanishSchema, 2)).toThrow('Expected a boolean or a string that can be parsed as a boolean');
    });
  });

  describe('coercedUrlListSchema', () => {
    test('this schema validates and coerces a comma separated string to an array of urls', () => {
      expect(v.parse(coercedUrlListSchema, 'http://localhost:3000')).toEqual(['http://localhost:3000']);
      expect(v.parse(coercedUrlListSchema, 'http://localhost:3000,http://localhost:3001')).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
      expect(v.parse(coercedUrlListSchema, [
        'http://localhost:3000',
        'http://localhost:3001',
      ])).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    test('otherwise it throws an error', () => {
      expect(() => v.parse(coercedUrlListSchema, 'non-url')).toThrow();
    });
  });

  describe('appSchemeSchema', () => {
    test('the app scheme can either be a comma separated string or an array of strings', () => {
      expect(v.parse(appSchemeSchema, 'papra://,exp://')).toEqual(['papra://', 'exp://']);
      expect(v.parse(appSchemeSchema, ['papra://', 'exp://'])).toEqual(['papra://', 'exp://']);
    });
  });
});
