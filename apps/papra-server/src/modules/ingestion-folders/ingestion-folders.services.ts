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
  // OR pipes since lookup returns false if the mime type is not found
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const { base: fileName } = parse(filePath);

  const file = new File([buffer], fileName, { type: mimeType });
  return { file };
}
