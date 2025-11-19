import { describe, expect, test } from 'vitest';
import { coerceDate } from './api.models';

describe('api models', () => {
  describe('coerceDate', () => {
    test('transforms date-ish values into Date instances', () => {
      expect(coerceDate(new Date('2024-01-01T00:00:00Z'))).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(coerceDate('2024-01-01T00:00:00Z')).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(coerceDate('2024-01-01')).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(coerceDate(1704067200000)).toEqual(new Date('2024-01-01T00:00:00Z'));

      expect(() => coerceDate(null)).toThrow('Invalid date: expected Date, string, or number, but received value "null" of type "object"');
      expect(() => coerceDate(undefined)).toThrow('Invalid date: expected Date, string, or number, but received value "undefined" of type "undefined"');
      expect(() => coerceDate({})).toThrow('Invalid date: expected Date, string, or number, but received value "[object Object]" of type "object"');
      expect(() => coerceDate(['foo'])).toThrow('Invalid date: expected Date, string, or number, but received value "foo" of type "object"');
      expect(() => coerceDate(true)).toThrow('Invalid date: expected Date, string, or number, but received value "true" of type "boolean"');
    });
  });
});
