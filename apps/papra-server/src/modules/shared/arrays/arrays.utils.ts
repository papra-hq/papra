import type { NonEmptyArray } from '../types';
import { isNil } from '../utils';

export function ensureNonEmptyArray<T>(array: T[] | undefined | null): NonEmptyArray<T> {
  if (!array || array.length === 0) {
    throw new Error('Expected a non-empty array');
  }

  return array as NonEmptyArray<T>;
}

export function isNonEmptyArray<T>(array: T[] | undefined | null): array is NonEmptyArray<T> {
  return !isNil(array) && array.length > 0;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
