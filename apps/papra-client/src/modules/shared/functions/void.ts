export function makeReturnVoid<T extends (...args: any[]) => any>(fn: T): (...funcArgs: Parameters<T>) => void {
  return (...args: Parameters<T>): void => {
    fn(...args);
  };
}

export function makeReturnVoidAsync<T extends (...args: any[]) => unknown>(fn: T): (...funcArgs: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>): Promise<void> => {
    await fn(...args);
  };
}
