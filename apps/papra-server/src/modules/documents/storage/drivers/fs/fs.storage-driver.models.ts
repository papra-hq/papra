import { isNil } from '../../../../shared/utils';

export function isFileNotFoundError({ error }: { error?: unknown }): boolean {
  return !isNil(error)
    && typeof error === 'object'
    && 'code' in error
    && error.code === 'ENOENT';
}
