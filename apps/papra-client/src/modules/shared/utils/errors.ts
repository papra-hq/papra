import { isObject } from './object';

export function getErrorStatus(error: unknown): number | undefined {
  if (isObject(error) && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }

  return undefined;
}
