import type { NestedDirectoryJSON } from 'memfs';
import type { FsNative } from './fs.services';
import { memfs } from 'memfs';
import { createFsServices } from './fs.services';

export function buildInMemoryFs(volume: NestedDirectoryJSON) {
  const { vol } = memfs(volume);

  const fs = {
    ...vol.promises,
    createReadStream: (filePath: string) => vol.createReadStream(filePath),
  } as FsNative;

  return {
    fs,
    getFsState: () => vol.toJSON(),
  };
}

export function createInMemoryFsServices(volume: NestedDirectoryJSON) {
  const { fs, getFsState } = buildInMemoryFs(volume);

  return {
    getFsState,
    fs: createFsServices({ fs }),
  };
}
