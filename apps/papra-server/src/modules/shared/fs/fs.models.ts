import { isNil, isString } from '../utils';

export function isCrossDeviceError({ error }: { error: Error & { code?: unknown } }) {
  if (isNil(error.code) || !isString(error.code)) {
    return false;
  }

  return [
    'EXDEV', // Linux based OS (see `man rename`)
    'ERROR_NOT_SAME_DEVICE', // Windows
  ].includes(error.code);
}
