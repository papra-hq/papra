import type { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import fsSyncNative from 'node:fs';
import fsPromisesNative from 'node:fs/promises';
import { injectArguments } from '@corentinth/chisels';
import { pick } from 'lodash-es';

// what we use from the native fs module
export type FsNative = {
  mkdir: (path: string, options: { recursive: true }) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  stat: (path: string) => Promise<{ size: number }>;
  readFile: (path: string) => Promise<Buffer>;
  access: (path: string, mode: number) => Promise<void>;
  constants: { F_OK: number };
  createReadStream: (path: string) => Readable;
};

const fsNative = {
  ...pick(fsPromisesNative, 'mkdir', 'unlink', 'rename', 'readFile', 'access', 'constants', 'stat'),
  createReadStream: fsSyncNative.createReadStream.bind(fsSyncNative) as (filePath: string) => Readable,
} as FsNative;

export type FsServices = ReturnType<typeof createFsServices>;
export function createFsServices({ fs = fsNative }: { fs?: FsNative } = {}) {
  return injectArguments(
    {
      ensureDirectoryExists,
      checkFileExists,
      deleteFile,
      moveFile,
      readFile,
      createReadStream,
      areFilesContentIdentical,
    },
    {
      fs,
    },
  );
}

export async function ensureDirectoryExists({ path, fs = fsNative }: { path: string; fs?: FsNative }): Promise<{ hasBeenCreated: boolean }> {
  const exists = await fs.access(path, fs.constants.F_OK).then(() => true).catch(() => false);

  if (exists) {
    return { hasBeenCreated: false };
  }

  await fs.mkdir(path, { recursive: true });

  return { hasBeenCreated: true };
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
  return fs.readFile(filePath);
}

export function createReadStream({ filePath, fs = fsNative }: { filePath: string; fs?: FsNative }) {
  return fs.createReadStream(filePath);
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
