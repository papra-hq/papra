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

export function isFileAlreadyExistsError({ error }: { error: Error & { code?: unknown; errno?: unknown } }) {
  if (
    'code' in error
    && isString(error.code)
    && ['EEXIST', 'ERROR_FILE_EXISTS'].includes(error.code)
  ) {
    return true;
  }

  if (isNil(error.errno)) {
    return false;
  }

  return error.errno === -17;
}
