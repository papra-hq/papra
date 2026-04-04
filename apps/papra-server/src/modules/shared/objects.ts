type OmitUndefined<T> = {
  [K in keyof T]: Exclude<T[K], undefined>;
};

export function omitUndefined<T extends Record<string, any>>(obj: T): OmitUndefined<T> {
  const result = {} as OmitUndefined<T>;

  for (const key in obj) {
    if (obj[key] !== undefined && Object.hasOwn(obj, key) && Object.propertyIsEnumerable.call(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[] | readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (Object.hasOwn(obj, key) && Object.propertyIsEnumerable.call(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}
