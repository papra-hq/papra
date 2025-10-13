import type { Expand } from '@corentinth/chisels';

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard to check if a value is a plain record object (not a Date, Array, or other special object)
 */
export function isRecord(obj: unknown): obj is Record<string, unknown> {
  return (
    isObject(obj)
    && !Array.isArray(obj)
    // Exclude Date objects and RegExp objects, and other built-in types
    && Object.prototype.toString.call(obj) === '[object Object]'
  );
}

/**
 * Deep merges multiple objects into a new object.
 * Later objects override properties from earlier objects.
 * Only plain objects are merged recursively - arrays and other types are replaced.
 *
 * @param objects - Objects to merge
 * @returns A new merged object
 *
 * @example
 * const a = { x: 1, nested: { a: 1 } };
 * const b = { y: 2, nested: { b: 2 } };
 * const c = { z: 3, nested: { c: 3 } };
 * const result = deepMerge(a, b, c);
 * // { x: 1, y: 2, z: 3, nested: { a: 1, b: 2, c: 3 } }
 */
export function deepMerge<T extends Record<string, any>[]>(
  ...objects: T
): T extends [infer First, ...infer Rest]
  ? Rest extends Record<string, any>[]
    ? Expand<First & DeepMergeAll<Rest>>
    : First
  : Record<string, unknown> {
  return objects.reduce((prev, obj) => {
    const result = { ...prev };

    Object.keys(obj).forEach((key) => {
      const pVal = result[key];
      const oVal = obj[key];

      if (isRecord(pVal) && isRecord(oVal)) {
        result[key] = deepMerge(pVal, oVal);
      } else if (isRecord(oVal)) {
        result[key] = deepMerge({}, oVal);
      } else if (Array.isArray(oVal)) {
        result[key] = [...oVal];
      } else {
        result[key] = oVal;
      }
    });

    return result;
  }, {}) as any;
}

// Helper type for merging multiple objects
type DeepMergeAll<T extends readonly any[]> = T extends [infer First, ...infer Rest]
  ? First & DeepMergeAll<Rest>
  : unknown;
