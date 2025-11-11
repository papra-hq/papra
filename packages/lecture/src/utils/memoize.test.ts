import { describe, expect, test, vi } from 'vitest';
import { memoize } from './memoize';

describe('memoize', () => {
  test('caches the result of a function call', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('handles multiple different arguments', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(10)).toBe(20);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('works with multiple parameters', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(2, 3)).toBe(5);
    expect(memoized(2, 3)).toBe(5);
    expect(memoized(3, 2)).toBe(5);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('works with string arguments', () => {
    const fn = vi.fn((str: string) => str.toUpperCase());
    const memoized = memoize(fn);

    expect(memoized('hello')).toBe('HELLO');
    expect(memoized('hello')).toBe('HELLO');
    expect(memoized('world')).toBe('WORLD');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('works with object arguments using default JSON.stringify', () => {
    const fn = vi.fn((obj: { x: number }) => obj.x * 2);
    const memoized = memoize(fn);

    expect(memoized({ x: 5 })).toBe(10);
    expect(memoized({ x: 5 })).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('uses custom key resolver when provided', () => {
    const fn = vi.fn((obj: { id: number; name: string }) => obj.name.toUpperCase());
    const keyResolver = (obj: { id: number; name: string }) => `id-${obj.id}`;
    const memoized = memoize(fn, keyResolver);

    expect(memoized({ id: 1, name: 'alice' })).toBe('ALICE');
    expect(memoized({ id: 1, name: 'bob' })).toBe('ALICE'); // cached by id
    expect(memoized({ id: 2, name: 'alice' })).toBe('ALICE');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('handles functions with no arguments', () => {
    let counter = 0;
    const fn = vi.fn(() => ++counter);
    const memoized = memoize(fn);

    expect(memoized()).toBe(1);
    expect(memoized()).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('preserves function return type', () => {
    const fn = (x: number): string => `result: ${x}`;
    const memoized = memoize(fn);

    const result: string = memoized(42);
    expect(result).toBe('result: 42');
  });

  test('caches falsy values correctly', () => {
    const fn = vi.fn((x: number) => x === 0 ? 0 : null);
    const memoized = memoize(fn);

    expect(memoized(0)).toBe(0);
    expect(memoized(0)).toBe(0);
    expect(memoized(1)).toBe(null);
    expect(memoized(1)).toBe(null);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
