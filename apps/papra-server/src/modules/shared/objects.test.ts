import { describe, expect, test } from 'vitest';
import { omitUndefined, pick } from './objects';

describe('objects', () => {
  describe('pick', () => {
    test('given an object and a list of keys, return a new object with only the specified keys', () => {
      expect(pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
    });

    test('when a key is not present in the object, it is ignored', () => {
      expect(pick({ a: 1, b: 2 }, ['a', 'c'] as ('a' | 'b')[])).toEqual({ a: 1 });
    });

    test('when a key is duplicated, it obviously only appears once in the result', () => {
      expect(pick({ a: 1, b: 2 }, ['a', 'a'])).toEqual({ a: 1 });
    });

    test('when the object is empty, the result is always an empty object', () => {
      expect(pick({}, [])).toEqual({});
      expect(pick({}, ['a', 'b'] as unknown as never[])).toEqual({});
    });

    test('when the list of keys is empty, the result is always an empty object', () => {
      expect(pick({ a: 1, b: 2 }, [])).toEqual({});
    });

    test('nested keys are not supported', () => {
      expect(pick({ a: { b: 1 } }, ['a'])).toEqual({ a: { b: 1 } });
      expect(pick({ a: { b: 1 } }, ['a.b'] as unknown as never[])).toEqual({});
    });

    test('resulting object is a new object, not a reference to the original one', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, ['a']);
      expect(result).toEqual({ a: 1 });
      expect(result).not.toBe(obj);
    });

    test('properties references are preserved', () => {
      const user = { name: 'Alice' };

      const obj = { user, b: 2 };
      const result = pick(obj, ['user']);

      expect(result).toEqual({ user: { name: 'Alice' } });
      expect(result.user).toBe(user);
    });

    test('when the object has properties in its prototype chain, they are ignored', () => {
      // eslint-disable-next-line ts/no-unsafe-assignment
      const obj = Object.create({ a: 1 });
      // eslint-disable-next-line ts/no-unsafe-member-access
      obj.b = 2;

      expect(pick(obj, ['a', 'b'] as unknown as never[])).toEqual({ b: 2 });
    });

    test('when the object has non-enumerable properties, they are ignored', () => {
      const obj = {};
      Object.defineProperty(obj, 'a', { value: 1, enumerable: false });
      Object.defineProperty(obj, 'b', { value: 2, enumerable: true });

      expect(pick(obj, ['a', 'b'] as unknown as never[])).toEqual({ b: 2 });
    });
  });

  describe('omitUndefined', () => {
    test('removes root undefined values and keeps the rest', () => {
      expect(
        omitUndefined({
          a: 1,
          b: undefined,
          c: 3,
          d: null,
          e: { f: undefined, g: 2 },
          f: '',
        }),
      ).toEqual({
        a: 1,
        c: 3,
        d: null,
        e: { f: undefined, g: 2 },
        f: '',
      });
    });

    test('returns an empty object when all values are undefined', () => {
      expect(omitUndefined({ a: undefined, b: undefined })).toEqual({});
    });

    test('returns a copy of the object when no values are undefined', () => {
      const obj = { a: 1, b: 2 };
      const result = omitUndefined(obj);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(obj);
    });

    test('returns an empty object when given an empty object', () => {
      expect(omitUndefined({})).toEqual({});
    });

    test('when the object has properties in its prototype chain, they are ignored', () => {
      // eslint-disable-next-line ts/no-unsafe-assignment
      const obj = Object.create({ a: 1 });
      // eslint-disable-next-line ts/no-unsafe-member-access
      obj.b = 2;

      expect(omitUndefined(obj)).toEqual({ b: 2 });
    });

    test('when the object has non-enumerable properties, they are ignored', () => {
      const obj = {};
      Object.defineProperty(obj, 'a', { value: 1, enumerable: false });
      Object.defineProperty(obj, 'b', { value: 2, enumerable: true });

      expect(omitUndefined(obj)).toEqual({ b: 2 });
    });
  });
});
