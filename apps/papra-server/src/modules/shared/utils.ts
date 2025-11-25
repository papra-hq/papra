import { isUndefined, omitBy } from 'lodash-es';

type OmitUndefined<T> = {
  [K in keyof T]: Exclude<T[K], undefined>;
};

export function omitUndefined<T extends Record<string, any>>(obj: T): OmitUndefined<T> {
  return omitBy(obj, isUndefined) as OmitUndefined<T>;
}

export function isNil(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

export function isNilOrEmptyString(value: unknown): value is null | undefined | '' {
  return isNil(value) || (isString(value) && value.length === 0);
}

export function isDefined<T>(value: T): value is Exclude<T, undefined | null> {
  return !isNil(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

export function nullifyPositiveInfinity(value: number): number | null {
  return value === Number.POSITIVE_INFINITY ? null : value;
}

export function uniqBy<T, K extends string | number | symbol>(array: T[], keyGetter: (item: T) => K): T[] {
  const seen: Record<string | number | symbol, boolean> = {};
  const result: T[] = [];

  for (const item of array) {
    const key = keyGetter(item);
    if (seen[key] === undefined) {
      seen[key] = true;
      result.push(item);
    }
  }

  return result;
}

export const uniq = <T extends string | number | symbol>(array: T[]): T[] => uniqBy(array, item => item);
