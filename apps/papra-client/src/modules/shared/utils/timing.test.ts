import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { debounce, throttle } from './timing';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('delays function execution until after wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(func).toHaveBeenCalledTimes(1);
  });

  test('only executes the last call when invoked multiple times rapidly', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc('first');
    debouncedFunc('second');
    debouncedFunc('third');

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('third');
  });

  test('executes multiple times if calls are spaced out beyond wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 60);

    debouncedFunc('first');
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('first');

    debouncedFunc('second');
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith('second');
  });

  test('preserves function arguments correctly', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc('arg1', 'arg2', 'arg3');

    vi.advanceTimersByTime(150);

    expect(func).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  test('works with async functions', () => {
    const asyncFunc = vi.fn(async (value: string) => {
      return `processed-${value}`;
    });

    const debouncedFunc = debounce(asyncFunc, 100);

    debouncedFunc('test');

    vi.advanceTimersByTime(150);

    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('test');
  });

  test('works with functions that have multiple parameter types', () => {
    const func = vi.fn((str: string, num: number, obj: { key: string }) => {
      return { str, num, obj };
    });

    const debouncedFunc = debounce(func, 100);

    debouncedFunc('hello', 42, { key: 'value' });

    vi.advanceTimersByTime(150);

    expect(func).toHaveBeenCalledWith('hello', 42, { key: 'value' });
  });

  test('handles zero wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 0);

    debouncedFunc('test');

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('test');
  });

  test('cancels previous timeout when called again before wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc('first');
    vi.advanceTimersByTime(50);

    debouncedFunc('second');
    vi.advanceTimersByTime(50);

    // First call should be cancelled
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60);

    // Only second call should execute
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('second');
  });

  test('works with no arguments', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();

    vi.advanceTimersByTime(150);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith();
  });

  test('preserves type safety for function parameters', () => {
    // Type-only test - this will fail TypeScript compilation if types are wrong
    const typedFunc = (name: string, age: number) => ({ name, age });
    const debouncedTypedFunc = debounce(typedFunc, 100);

    // This should compile without errors
    debouncedTypedFunc('John', 30);

    // These should cause TypeScript errors (commented out):
    // debouncedTypedFunc(123, 'wrong'); // Wrong argument types
    // debouncedTypedFunc('John'); // Missing argument

    vi.advanceTimersByTime(150);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('invokes function immediately on first call', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc('test');

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('test');
  });

  test('ignores rapid calls within wait period', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc('first');
    throttledFunc('second');
    throttledFunc('third');

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('first');
  });

  test('invokes function again after wait period', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc('first');
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(150);

    throttledFunc('second');
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith('second');
  });

  test('schedules trailing call if invoked during wait period', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc('first');
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(50);
    throttledFunc('second');
    expect(func).toHaveBeenCalledTimes(1);

    // Should invoke after remaining wait time
    vi.advanceTimersByTime(50);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith('second');
  });

  test('uses latest arguments for trailing call', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc('first');
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30);
    throttledFunc('second');

    vi.advanceTimersByTime(30);
    throttledFunc('third');

    vi.advanceTimersByTime(40);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith('third');
  });

  test('works with multiple parameter types', () => {
    const func = vi.fn((str: string, num: number, obj: { key: string }) => {
      return { str, num, obj };
    });

    const throttledFunc = throttle(func, 100);

    throttledFunc('hello', 42, { key: 'value' });

    expect(func).toHaveBeenCalledWith('hello', 42, { key: 'value' });
  });

  test('works with async functions', () => {
    const asyncFunc = vi.fn(async (value: string) => {
      return `processed-${value}`;
    });

    const throttledFunc = throttle(asyncFunc, 100);

    throttledFunc('test');

    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('test');
  });

  test('works with no arguments', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith();
  });

  test('preserves type safety for function parameters', () => {
    // Type-only test - this will fail TypeScript compilation if types are wrong
    const typedFunc = (name: string, age: number) => ({ name, age });
    const throttledTypedFunc = throttle(typedFunc, 100);

    // This should compile without errors
    throttledTypedFunc('John', 30);

    // These should cause TypeScript errors (commented out):
    // throttledTypedFunc(123, 'wrong'); // Wrong argument types
    // throttledTypedFunc('John'); // Missing argument

    expect(true).toBe(true);
  });

  test('handles multiple invocations over time correctly', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    // First call - immediate
    throttledFunc('call1');
    expect(func).toHaveBeenCalledTimes(1);

    // Within wait period - scheduled
    vi.advanceTimersByTime(50);
    throttledFunc('call2');
    expect(func).toHaveBeenCalledTimes(1);

    // Complete wait period - trailing call executes
    vi.advanceTimersByTime(50);
    expect(func).toHaveBeenCalledTimes(2);

    // Wait full period before next call
    vi.advanceTimersByTime(100);
    throttledFunc('call3');
    expect(func).toHaveBeenCalledTimes(3);
    expect(func).toHaveBeenCalledWith('call3');
  });
});
