import { describe, expect, test } from 'vitest';
import { deepMerge } from './object';

describe('object utilities', () => {
  describe('deepMerge', () => {
    test('merges two flat objects', () => {
      const a = { x: 1, y: 2 };
      const b = { y: 3, z: 4 };

      const result = deepMerge(a, b);

      expect(result).toEqual({ x: 1, y: 3, z: 4 });
    });

    test('does not mutate original objects', () => {
      const a = { x: 1, y: 2 };
      const b = { y: 3, z: 4 };

      deepMerge(a, b);

      expect(a).toEqual({ x: 1, y: 2 });
      expect(b).toEqual({ y: 3, z: 4 });
    });

    test('creates deep copies without shared references', () => {
      const a = { nested: { value: 1 }, arr: [1, 2, 3] };
      const b = { other: 'test' };

      const result = deepMerge(a, b);

      // Mutate the result
      result.nested.value = 999;
      result.arr.push(4);

      // Original should be unchanged
      expect(a.nested.value).toBe(1);
      expect(a.arr).toEqual([1, 2, 3]);
    });

    test('deeply merges nested objects', () => {
      const a = { nested: { a: 1, b: 2 }, x: 1 };
      const b = { nested: { b: 3, c: 4 }, y: 2 };

      const result = deepMerge(a, b);

      expect(result).toEqual({
        x: 1,
        y: 2,
        nested: { a: 1, b: 3, c: 4 },
      });
    });

    test('handles multiple levels of nesting', () => {
      const a = {
        level1: {
          level2: {
            a: 1,
            b: 2,
          },
          x: 1,
        },
      };
      const b = {
        level1: {
          level2: {
            b: 3,
            c: 4,
          },
          y: 2,
        },
      };

      const result = deepMerge(a, b);

      expect(result).toEqual({
        level1: {
          level2: {
            a: 1,
            b: 3,
            c: 4,
          },
          x: 1,
          y: 2,
        },
      });
    });

    test('replaces arrays instead of merging them', () => {
      const a = { arr: [1, 2, 3] };
      const b = { arr: [4, 5] };

      const result = deepMerge(a, b);

      expect(result).toEqual({ arr: [4, 5] });
    });

    test('replaces primitives with objects', () => {
      const a = { value: 'string' };
      const b = { value: { nested: 'object' } };

      const result = deepMerge(a, b);

      expect(result).toEqual({ value: { nested: 'object' } });
    });

    test('replaces objects with primitives', () => {
      const a = { value: { nested: 'object' } };
      const b = { value: 'string' };

      const result = deepMerge(a, b);

      expect(result).toEqual({ value: 'string' });
    });

    test('handles null values', () => {
      const a = { value: { nested: 'object' } };
      const b = { value: null };

      const result = deepMerge(a, b);

      expect(result).toEqual({ value: null });
    });

    test('handles undefined values', () => {
      const a = { x: 1, y: 2 };
      const b = { y: undefined, z: 3 };

      const result = deepMerge(a, b);

      expect(result).toEqual({ x: 1, y: undefined, z: 3 });
    });

    test('handles empty objects', () => {
      const a = { x: 1 };
      const b = {};

      const result = deepMerge(a, b);

      expect(result).toEqual({ x: 1 });
    });

    test('merges into empty object', () => {
      const a = {};
      const b = { x: 1, y: 2 };

      const result = deepMerge(a, b);

      expect(result).toEqual({ x: 1, y: 2 });
    });

    test('does not merge Date objects', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-12-31');

      const a = { date: date1 };
      const b = { date: date2 };

      const result = deepMerge(a, b);

      expect(result.date).toBe(date2);
    });

    test('merges class instances as plain objects', () => {
      class MyClass {
        constructor(public value: number) {}
      }

      const a = { instance: new MyClass(1) };
      const b = { instance: new MyClass(2) };

      const result = deepMerge(a, b);

      // Class instances that look like plain objects get merged
      expect(result.instance.value).toBe(2);
    });

    test('preserves type information', () => {
      const a = { x: 1 as number };
      const b = { y: 'hello' as string };

      const result = deepMerge(a, b);

      // Type assertion to verify TypeScript types
      const x: number = result.x;
      const y: string = result.y;

      expect(x).toBe(1);
      expect(y).toBe('hello');
    });

    test('handles complex nested structure', () => {
      const a = {
        config: {
          api: {
            baseUrl: 'https://old.com',
            timeout: 5000,
          },
          features: {
            darkMode: false,
          },
        },
      };

      const b = {
        config: {
          api: {
            baseUrl: 'https://new.com',
          },
          features: {
            experimental: true,
          },
        },
      };

      const result = deepMerge(a, b);

      expect(result).toEqual({
        config: {
          api: {
            baseUrl: 'https://new.com',
            timeout: 5000,
          },
          features: {
            darkMode: false,
            experimental: true,
          },
        },
      });
    });
  });
});
