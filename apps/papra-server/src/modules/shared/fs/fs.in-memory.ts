import type { NestedDirectoryJSON } from 'memfs';
import { memfs } from 'memfs';
import { createFsServices, type FsNative } from './fs.services';

export function createInMemoryFsServices(volume: NestedDirectoryJSON) {
  const { vol } = memfs(volume);

  return {
    getFsState: () => vol.toJSON(),
    fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
  };
}
