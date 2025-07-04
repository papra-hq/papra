import process from 'node:process';
import { memoize } from 'lodash-es';

export const getRootDirPath = memoize(() => process.cwd());

// Working with libsql, file url can be relative, which is not correct according to RFC 8089, which standardizes the `file` scheme
// see https://github.com/tursodatabase/libsql-client-ts/blob/ee036574f5c23335c8b2d6d0c0e117cbe14bf376/packages/libsql-core/src/uri.ts
export function fileUrlToPath({ fileUrl }: { fileUrl: string }) {
  const rawPath = fileUrl.replace(/^file:(?:\/\/)?/, '');

  return decodeURIComponent(rawPath);
}
