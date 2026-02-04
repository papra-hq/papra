export function castArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 *  Returns an array containing the value if the condition is true, otherwise returns an empty array.
 *  @example
 *  ```ts
 *  const array = [
 *    ...toArrayIf(true, 'a'),
 *    ...toArrayIf(false, 'b'),
 *    ...toArrayIf(true, 'c'),
 *  ];
 *
 *  console.log(array); // Output: ['a', 'c']
 *  ```
 *  Instead of writing:
 *  ```ts
 *  const array = [
 *    ...(true ? ['a'] : []),
 *    ...(false ? ['b'] : []),
 *    ...(true ? ['c'] : []),
 *  ];
 *  console.log(array); // Output: ['a', 'c']
 *  ```
 */
export function toArrayIf<C extends boolean, T>(condition: C, value: T): C extends true ? T[] : [] {
  return (condition ? [value] : []) as C extends true ? T[] : [];
}
