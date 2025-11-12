import { get } from 'lodash-es';

export function isUniqueConstraintError({ error }: { error: unknown }): boolean {
  const message: unknown = get(error, 'message');
  const code: unknown = get(error, 'code');

  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return true;
  }

  return typeof message === 'string' && message.toLowerCase().includes('unique constraint failed');
}
