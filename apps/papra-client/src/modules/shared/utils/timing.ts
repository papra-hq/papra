import type { Accessor } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param waitMs - The number of milliseconds to delay
 * @returns The debounced function
 *
 * @example
 * const search = debounce(async (query: string) => {
 *   const results = await searchAPI(query);
 *   return results;
 * }, 300);
 *
 * search('hello'); // Only the last call within 300ms will execute
 */
export function debounce<Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  waitMs: number = 500,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, waitMs);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * The throttled function will invoke func on the leading edge of the timeout.
 *
 * @param func - The function to throttle
 * @param waitMs - The number of milliseconds to throttle invocations to
 * @returns The throttled function
 *
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('Scroll event');
 * }, 100);
 *
 * window.addEventListener('scroll', handleScroll);
 */
export function throttle<Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  waitMs: number = 500,
): (...args: Args) => void {
  let lastCallTime: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args): void => {
    const now = Date.now();

    if (lastCallTime === undefined) {
      // First call - invoke immediately
      func(...args);
      lastCallTime = now;
      return;
    }

    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= waitMs) {
      // Enough time has passed - invoke immediately
      func(...args);
      lastCallTime = now;
      return;
    }

    // Schedule invocation for when the wait period ends
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      lastCallTime = Date.now();
      timeoutId = undefined;
    }, waitMs - timeSinceLastCall);
  };
}

export function useDebounce<T>(signal: Accessor<T>, waitMs: number = 500): Accessor<T> {
  const [debouncedValue, setDebouncedValue] = createSignal<T>(signal());

  const debouncedSetter = debounce((value: T) => setDebouncedValue(() => value), waitMs);

  createEffect(() => {
    debouncedSetter(signal());
  });

  return debouncedValue;
}
