export function ensureBooleanArg(arg: unknown): boolean {
  if (typeof arg === 'boolean') {
    return arg;
  }

  if (typeof arg === 'string') {
    const value = arg.trim().toLowerCase();

    const isTruthy = ['true', '1', 'yes', 'y', 'on'].includes(value);

    if (isTruthy) {
      return true;
    }

    const isFalsy = ['false', '0', 'no', 'n', 'off'].includes(value);

    if (isFalsy) {
      return false;
    }
  }

  throw new Error(`Invalid boolean argument: ${String(arg)}`);
}
