import { uniq } from 'lodash-es';
import { bench, describe } from 'vitest';

describe.skip('uniq', () => {
  const array = Array.from({ length: 10_000 }, (_, i) => i % 100);

  bench('array.from(new Set(array))', () => {
    const result = Array.from(new Set(array));
    void result;
  });

  bench('[...new Set(array)]', () => {
    const result = [...new Set(array)];
    void result;
  });

  bench('for of with set', () => {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const item of array) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    void result;
  });

  bench('for of with object', () => {
    const seen: Record<number, boolean> = {};
    const result: number[] = [];
    for (const item of array) {
      if (seen[item] === undefined) {
        seen[item] = true;
        result.push(item);
      }
    }
    void result;
  });

  bench('for loop with object', () => {
    const seen: Record<number, boolean> = {};
    const result: number[] = [];
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item !== undefined && seen[item] === undefined) {
        seen[item] = true;
        result.push(item);
      }
    }
    void result;
  });

  bench('lodash uniq', () => {
    const result = uniq(array);
    void result;
  });
});
