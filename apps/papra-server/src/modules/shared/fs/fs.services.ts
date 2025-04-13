import { Buffer } from 'node:buffer';
import fsNative from 'node:fs/promises';
import { injectArguments } from '@corentinth/chisels';

export type FsNative = Pick<typeof fsNative, 'mkdir' | 'unlink' | 'rename' | 'readFile' | 'stat' | 'access' | 'constants'>;

export type FsServices = ReturnType<typeof createFsServices>;
export function createFsServices({ fs = fsNative }: { fs?: FsNative } = {}) {
  return injectArguments(
    {
      ensureDirectoryExists,
      checkFileExists,
      deleteFile,
      moveFile,
      readFile,
      areFilesContentIdentical,
    },
    {
      fs,
    },
  );
}

export async function ensureDirectoryExists({ path, fs = fsNative }: { path: string; fs?: FsNative }) {
  await fs.mkdir(path, { recursive: true });
}

export async function checkFileExists({ path, fs = fsNative }: { path: string; fs?: FsNative }) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile({ filePath, fs = fsNative }: { filePath: string; fs?: FsNative }) {
  await fs.unlink(filePath);
}

export async function moveFile({ sourceFilePath, destinationFilePath, fs = fsNative }: { sourceFilePath: string; destinationFilePath: string; fs?: FsNative }) {
  await fs.rename(sourceFilePath, destinationFilePath);
}

export async function readFile({ filePath, fs = fsNative }: { filePath: string; fs?: FsNative }) {
  return await fs.readFile(filePath);
}

export async function areFilesContentIdentical({ file1, file2, fs = fsNative }: { file1: string; file2: string; fs?: FsNative }): Promise<boolean> {
  try {
    // Check if file sizes are different (quick check before comparing content)
    const stats1 = await fs.stat(file1);
    const stats2 = await fs.stat(file2);

    if (stats1.size !== stats2.size) {
      return false;
    }

    // Compare file contents
    const content1 = await readFile({ filePath: file1, fs });
    const content2 = await readFile({ filePath: file2, fs });

    return Buffer.compare(content1, content2) === 0;
  } catch (_) {
    return false;
  }
}
