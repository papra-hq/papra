import { describe, expect, test } from 'vitest';
import { makeReturnVoid, makeReturnVoidAsync } from './void';

describe('void', () => {
  describe('makeReturnVoid', () => {
    test('given a function, when called, then it returns void and calls the original function with the same arguments', () => {
      const args: unknown[][] = [];

      const fn = (a: number, b: number) => {
        args.push([a, b]);
        return a + b;
      };

      const voidFn = makeReturnVoid(fn);

      const result = voidFn(2, 3);

      expect(result).toBeUndefined();
      expect(args).toEqual([[2, 3]]);
    });
  });

  describe('makeReturnVoidAsync', () => {
    test('given an async function, when called, then it returns Promise<void> and calls the original function with the same arguments', async () => {
      const args: unknown[][] = [];

      const fn = async (a: number, b: number) => {
        args.push([a, b]);
        return a + b;
      };

      const voidFn = makeReturnVoidAsync(fn);

      const result = await voidFn(5, 7);

      expect(result).toBeUndefined();
      expect(args).toEqual([[5, 7]]);
    });

    test('given a sync function, when called, then it returns Promise<void> and calls the original function with the same arguments', async () => {
      const args: unknown[][] = [];

      const fn = (a: number, b: number) => {
        args.push([a, b]);
        return a + b;
      };

      const voidFn = makeReturnVoidAsync(fn);

      const result = await voidFn(10, 15);

      expect(result).toBeUndefined();
      expect(args).toEqual([[10, 15]]);
    });
  });
});
