import type { NestedDirectoryJSON } from 'memfs';
import type { FsNative } from './fs.services';
import { memfs } from 'memfs';
import { createFsServices } from './fs.services';

export function createInMemoryFsServices(volume: NestedDirectoryJSON) {
  const { vol } = memfs(volume);

  const fs = {
    ...vol.promises,
    createReadStream: (filePath: string) => vol.createReadStream(filePath),
  } as FsNative;

  return {
    getFsState: () => vol.toJSON(),
    fs: createFsServices({ fs }),
  };
}
