import { safely } from '@corentinth/chisels';
import { fileTypeFromBlob } from 'file-type';
import { isNilOrEmptyString } from '../utils';
import { getMimeTypeFromFileName } from './mime-types.models';

export async function coerceFileMimeType({ file }: { file: File }): Promise<{ mimeType: string }> {
  const declaredMimeType = file.type;

  if (!isNilOrEmptyString(declaredMimeType) && declaredMimeType !== 'application/octet-stream') {
    return { mimeType: declaredMimeType };
  }

  const [detected] = await safely(fileTypeFromBlob(file));
  if (detected) {
    return { mimeType: detected.mime };
  }

  const extensionMimeType = getMimeTypeFromFileName(file.name);

  return { mimeType: extensionMimeType };
}
