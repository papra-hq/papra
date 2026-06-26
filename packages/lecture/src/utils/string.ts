export function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      // JSON.stringify throws on circular references and bigint values, fall back to a safe tag.
      return Object.prototype.toString.call(value);
    }
  }

  // number, boolean, bigint, symbol, function, null and undefined are all safe to coerce with String.
  return String(value);
}
