import mime from 'mime-types';
import { MIME_TYPES } from './mime-types.constants';
import { isNilOrEmptyString } from '../utils';

export function getMimeTypeFromFileName(fileName: string): string {
  const mimeType = mime.lookup(fileName);

  return mimeType === false ? MIME_TYPES.OCTET_STREAM : mimeType;
}

export function isMimeTypeAllowed({
  mimeType,
  allowList,
}: {
  mimeType: string;
  allowList: Set<string>;
}): boolean {
  const mimeTypeWithoutParameters = mimeType.split(';')[0]!.trim();
  const [type, subtype, ...rest] = mimeTypeWithoutParameters.split('/');

  if (isNilOrEmptyString(type) || isNilOrEmptyString(subtype) || rest.length > 0) {
    return false;
  }

  const group = `${type}/*`;
  const negatedMimeType = `!${mimeTypeWithoutParameters}`;
  const negatedGroup = `!${group}`;

  if (allowList.has(negatedMimeType) || allowList.has(negatedGroup)) {
    return false;
  }

  if (allowList.has(mimeTypeWithoutParameters) || allowList.has(group) || allowList.has('*')) {
    return true;
  }

  return false;
}
