import { isNil } from '../utils';

export function isUniqueConstraintError({ error }: { error: unknown }): boolean {
  if (isNil(error) || typeof error !== 'object') {
    return false;
  }

  const message: unknown = 'message' in error ? error.message : undefined;
  const code: unknown = 'code' in error ? error.code : undefined;

  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return true;
  }

  return typeof message === 'string' && message.toLowerCase().includes('unique constraint failed');
}
