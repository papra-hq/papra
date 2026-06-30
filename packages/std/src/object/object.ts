export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): Record<keyof T, U> {
  const result: Partial<Record<keyof T, U>> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = fn(obj[key], key);
    }
  }
  return result as Record<keyof T, U>;
}
