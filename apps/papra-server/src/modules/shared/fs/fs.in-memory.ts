import type { NestedDirectoryJSON } from 'memfs';
import type { FsNative } from './fs.services';
import { memfs } from 'memfs';
import { createFsServices } from './fs.services';

export function createInMemoryFsServices(volume: NestedDirectoryJSON) {
  const { vol } = memfs(volume);

  return {
    getFsState: () => vol.toJSON(),
    fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
  };
}
