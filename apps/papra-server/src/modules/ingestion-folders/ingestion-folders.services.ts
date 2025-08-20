import type {
  FsServices,
} from '../shared/fs/fs.services';
import { parse } from 'node:path';
import mime from 'mime-types';
import {
  createFsServices,
} from '../shared/fs/fs.services';

export function getFile({
  filePath,
  fs = createFsServices(),
}: {
  filePath: string;
  fs?: Pick<FsServices, 'createReadStream'>;
}) {
  const fileStream = fs.createReadStream({ filePath });
  // lookup returns false if the mime type is not found
  const lookedUpMimeType = mime.lookup(filePath);
  const mimeType = lookedUpMimeType === false ? 'application/octet-stream' : lookedUpMimeType;

  const { base: fileName } = parse(filePath);

  return { fileStream, mimeType, fileName };
}
