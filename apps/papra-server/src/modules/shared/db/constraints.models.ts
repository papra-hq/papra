import { get } from 'lodash-es';

export { isUniqueConstraintError };

function isUniqueConstraintError({ error }: { error: unknown }): boolean {
  return get(error, 'code') === 'SQLITE_CONSTRAINT_UNIQUE';
}
