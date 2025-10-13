import { isObject } from './object';

/**
 * Gets a value from an object at the specified path.
 * If multiple paths are provided, returns the first non-undefined value.
 *
 * @param obj - The object to query
 * @param paths - One or more paths as string arrays (e.g., ['user', 'name'])
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * const obj = { user: { name: 'John', age: 30 }, fallback: 'default' };
 *
 * get(obj, ['user', 'name']); // 'John'
 * get(obj, ['user', 'missing']); // undefined
 * get(obj, ['missing'], ['fallback']); // 'default' (first non-undefined)
 * get(obj, ['a', 'b', 'c']); // undefined
 */
export function get(obj: unknown, ...paths: string[][]): unknown {
  if (!isObject(obj)) {
    return undefined;
  }

  for (const path of paths) {
    let current: any = obj;

    for (const key of path) {
      if (isObject(current) && key in current) {
        current = (current as Record<string, any>)[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined) {
      return current;
    }
  }

  return undefined;
}
