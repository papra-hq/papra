import type {
  FsServices,
} from '../shared/fs/fs.services';
import { parse } from 'node:path';
import {
  createFsServices,
} from '../shared/fs/fs.services';
import { getMimeTypeFromFileName } from '../shared/mime-types/mime-types.models';

export function getFile({
  filePath,
  fs = createFsServices(),
}: {
  filePath: string;
  fs?: Pick<FsServices, 'createReadStream'>;
}) {
  const fileStream = fs.createReadStream({ filePath });
  const mimeType = getMimeTypeFromFileName(filePath);

  const { base: fileName } = parse(filePath);

  return { fileStream, mimeType, fileName };
}
