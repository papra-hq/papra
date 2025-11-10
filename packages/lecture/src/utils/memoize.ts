export function memoize<F extends (...args: unknown[]) => any>(fn: F, keyResolver?: (...args: Parameters<F>) => string): F {
  const cache: { [key: string]: ReturnType<F> } = {};

  const memoizedFn = (...args: Parameters<F>): ReturnType<F> => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    if (key in cache) {
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  };

  return memoizedFn as F;
}
