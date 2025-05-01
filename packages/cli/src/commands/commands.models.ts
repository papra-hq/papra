export function ensureString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof value}: ${value}`);
  }

  return value;
}
