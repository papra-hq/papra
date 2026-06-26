import { describe, expect, test } from 'vitest';
import { stringify, ensureString } from './string';

describe('string', () => {
  describe('stringify', () => {
    test('returns strings unchanged', () => {
      expect(stringify('hello')).toBe('hello');
      expect(stringify('')).toBe('');
    });

    test('coerces numbers, including special values', () => {
      expect(stringify(42)).toBe('42');
      expect(stringify(-3.14)).toBe('-3.14');
      expect(stringify(0)).toBe('0');
      expect(stringify(Number.NaN)).toBe('NaN');
      expect(stringify(Number.POSITIVE_INFINITY)).toBe('Infinity');
    });

    test('coerces booleans', () => {
      expect(stringify(true)).toBe('true');
      expect(stringify(false)).toBe('false');
    });

    test('coerces bigints', () => {
      expect(stringify(9007199254740993n)).toBe('9007199254740993');
    });

    test('coerces null and undefined to their textual form', () => {
      expect(stringify(null)).toBe('null');
      expect(stringify(undefined)).toBe('undefined');
    });

    test('coerces symbols', () => {
      expect(stringify(Symbol('tag'))).toBe('Symbol(tag)');
    });

    test('serializes plain objects and arrays as JSON', () => {
      expect(stringify({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}');
      expect(stringify([1, 'two', true])).toBe('[1,"two",true]');
      expect(stringify({ nested: { value: [1, 2] } })).toBe('{"nested":{"value":[1,2]}}');
    });

    test('falls back to a safe tag when JSON serialization throws', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(stringify(circular)).toBe('[object Object]');
    });
  });

  describe('ensureString', () => {
    test('returns strings unchanged and throws for non-string values', () => {
      expect(ensureString('hello')).toBe('hello');
      expect(ensureString('')).toBe('');

      expect(() => ensureString(42)).toThrow(TypeError);
      expect(() => ensureString(true)).toThrow(TypeError);
      expect(() => ensureString(null)).toThrow(TypeError);
      expect(() => ensureString(undefined)).toThrow(TypeError);
      expect(() => ensureString({})).toThrow(TypeError);
      expect(() => ensureString([])).toThrow(TypeError);
    });
  });
});
