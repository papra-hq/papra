import mime from 'mime-types';
import { MIME_TYPES } from './mime-types.constants';

export function getMimeTypeFromFileName(fileName: string): string {
  const mimeType = mime.lookup(fileName);

  return mimeType === false ? MIME_TYPES.OCTET_STREAM : mimeType;
}
