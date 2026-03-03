import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function createDisposableTmpDirectory({ prefix = 'tests-'}: { prefix?: string } = {}) {
  const tmpDirectoryPath = await mkdtemp(join(tmpdir(), prefix));

  const removeTmpDirectory = async () => {
    await rm(tmpDirectoryPath, { recursive: true, maxRetries: 0, force: true });
  };

  return {
    tmpDirectoryPath,
    removeTmpDirectory,
    [Symbol.asyncDispose]: async () => {
      await removeTmpDirectory();
    },
  };
}
