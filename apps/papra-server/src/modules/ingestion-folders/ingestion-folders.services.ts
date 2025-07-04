import type {
  FsServices,
} from '../shared/fs/fs.services';
import { parse } from 'node:path';
import mime from 'mime-types';
import {
  createFsServices,
} from '../shared/fs/fs.services';

export async function getFile({
  filePath,
  fs = createFsServices(),
}: {
  filePath: string;
  fs?: Pick<FsServices, 'readFile'>;
}) {
  const buffer = await fs.readFile({ filePath });
  // lookup returns false if the mime type is not found
  const lookedUpMimeType = mime.lookup(filePath);
  const mimeType = lookedUpMimeType === false ? 'application/octet-stream' : lookedUpMimeType;

  const { base: fileName } = parse(filePath);

  const file = new File([buffer], fileName, { type: mimeType });
  return { file };
}
