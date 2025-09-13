import { describe, expect, test } from 'vitest';
import { buildInMemoryFs } from './fs.in-memory';
import { moveFile } from './fs.services';

describe('fs services', () => {
  describe('moveFile', () => {
    test('moves a file from the source path to the destination path', async () => {
      const { fs, getFsState } = buildInMemoryFs({
        '/file.txt': 'test content',
      });

      await moveFile({
        sourceFilePath: '/file.txt',
        destinationFilePath: '/renamed.txt',
        fs,
      });

      expect(getFsState()).to.eql({
        '/renamed.txt': 'test content',
      });
    });

    test('if the destination file is in a different partition or disk, or a different docker volume, the underlying rename operation fails with an EXDEV error, so we fallback to copy + delete the source file', async () => {
      const { fs, getFsState } = buildInMemoryFs({
        '/file.txt': 'test content',
      });

      await moveFile({
        sourceFilePath: '/file.txt',
        destinationFilePath: '/renamed.txt',
        fs: {
          ...fs,
          rename: async () => {
            // Simulate an EXDEV error
            throw Object.assign(new Error('EXDEV'), { code: 'EXDEV' });
          },
        },
      });

      expect(getFsState()).to.eql({
        '/renamed.txt': 'test content',
      });
    });
  });
});
