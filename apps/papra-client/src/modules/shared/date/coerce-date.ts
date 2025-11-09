import type { CoercibleDate } from './date.types';

export function coerceDate(date: CoercibleDate): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date);
  }

  throw new Error(`Invalid date: expected Date, string, or number, but received value "${date}" of type "${typeof date}"`);
}
