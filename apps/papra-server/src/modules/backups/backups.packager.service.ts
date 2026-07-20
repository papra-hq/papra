import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { createGzip, createGunzip } from 'node:zlib';
import { isNil } from '../shared/utils';

// Minimal hand-rolled tar packer/unpacker. Why no `tar` npm package?
//   - Most tar libs are 50KB+ with full pax/ustar support
//   - We only need to (de)serialize flat archives of files, no symlinks/permissions
//   - Reduces the dependency audit surface
//
// Format: classic ustar (POSIX.1-1988). Each entry is a 512-byte header followed
// by the file content padded to 512 bytes. End-of-archive is two zero blocks.
//
// We use a small subset of ustar:
//   - File names up to 100 chars (split into name + prefix if needed, but we
//     restrict to 100 to keep the simple header layout)
//   - Regular files only (no directories, symlinks, etc.)
//   - No extended attributes (pax)
//   - 8-byte size field (max 8GB files, plenty for backups)
//
// Restore (extraction) returns an array of {name, content} pairs.

const BLOCK_SIZE = 512;
const FILE_MODE_REGULAR = 0o644;

type TarEntry = { name: string; content: Buffer };

function padToBlock(buffer: Buffer): Buffer {
  const remainder = buffer.length % BLOCK_SIZE;
  if (remainder === 0) {
    return buffer;
  }
  const padding = BLOCK_SIZE - remainder;
  return Buffer.concat([buffer, Buffer.alloc(padding)]);
}

function writeOctal(buffer: Buffer, offset: number, value: number, length: number): void {
  // ustar octal fields are right-padded with NULs, NOT spaces.
  const str = value.toString(8).padStart(length - 1, '0') + '\0';
  buffer.write(str, offset, length, 'utf8');
}

function writeString(buffer: Buffer, offset: number, value: string, length: number): void {
  const truncated = value.slice(0, length);
  buffer.write(truncated, offset, length, 'utf8');
}

function checksum(header: Buffer): number {
  // ustar checksum: sum of all bytes, with the checksum field treated as 8 spaces.
  let sum = 0;
  for (let i = 0; i < BLOCK_SIZE; i += 1) {
    const inChecksumField = i >= 148 && i < 156;
    sum += inChecksumField ? 0x20 : header[i]!;
  }
  return sum;
}

function buildEntryHeader({ name, size }: { name: string; size: number }): Buffer {
  const header = Buffer.alloc(BLOCK_SIZE);
  // name (100 bytes at offset 0)
  writeString(header, 0, name, 100);
  // mode (8 bytes at offset 100): "0000644\0"
  writeOctal(header, 100, FILE_MODE_REGULAR, 8);
  // uid (8 bytes at offset 108): "0000000\0"
  writeOctal(header, 108, 0, 8);
  // gid (8 bytes at offset 116): "0000000\0"
  writeOctal(header, 116, 0, 8);
  // size (12 bytes at offset 124)
  writeOctal(header, 124, size, 12);
  // mtime (12 bytes at offset 136)
  writeOctal(header, 136, Math.floor(Date.now() / 1000), 12);
  // checksum placeholder (8 bytes at offset 148) — set after computing it
  // typeflag (1 byte at offset 156): '0' for regular file
  header.write('0', 156, 'utf8');
  // ustar magic at offset 257
  writeString(header, 257, 'ustar', 6);
  // ustar version at offset 263: "00"
  writeString(header, 263, '00', 2);

  const sum = checksum(header);
  // Checksum field is 6 octal digits + NUL + space, per ustar spec.
  writeOctal(header, 148, sum, 7);
  header.write(' ', 155, 'utf8');

  return header;
}

// Pack an array of entries into a single Buffer (the tarball bytes).
function packTar(entries: TarEntry[]): Buffer {
  const blocks: Buffer[] = [];
  for (const entry of entries) {
    blocks.push(buildEntryHeader({ name: entry.name, size: entry.content.length }));
    blocks.push(padToBlock(entry.content));
  }
  // End-of-archive marker: two 512-byte zero blocks.
  blocks.push(Buffer.alloc(BLOCK_SIZE * 2));
  return Buffer.concat(blocks);
}

function readOctal(buffer: Buffer, offset: number, length: number): number {
  // Trim trailing NULs and spaces.
  const raw = buffer.subarray(offset, offset + length).toString('utf8').replace(/\0+$/g, '').trimEnd();
  if (raw.length === 0) {
    return 0;
  }
  return Number.parseInt(raw, 8);
}

function readString(buffer: Buffer, offset: number, length: number): string {
  // Tar header strings are NUL-terminated, NOT NUL-padded everywhere. Trim NULs.
  return buffer.subarray(offset, offset + length).toString('utf8').replace(/\0+$/g, '').trimEnd();
}

// Unpack a tarball Buffer into its entries. Stops at the first all-zero block.
function unpackTar(buffer: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;
  while (offset + BLOCK_SIZE <= buffer.length) {
    const header = buffer.subarray(offset, offset + BLOCK_SIZE);
    if (header.every((b) => b === 0)) {
      break; // end-of-archive
    }
    const name = readString(header, 0, 100);
    const size = readOctal(header, 124, 12);
    offset += BLOCK_SIZE;
    const content = Buffer.from(buffer.subarray(offset, offset + size));
    entries.push({ name, content });
    offset += padToBlock(content).length;
  }
  return entries;
}

// High-level service. Handles gzip on top of tar so the final upload is a
// compressed archive — important for backups of full PDFs/images where the
// compression ratio is decent.
export function createBackupPackagerService() {
  return {
    // Build a compressed backup from the manifest + file map. Returns the
    // final bytes ready to be encrypted and uploaded.
    async pack({ manifest, files }: { manifest: object; files: { name: string; content: Buffer }[] }): Promise<Buffer> {
      const entries: TarEntry[] = [
        { name: 'manifest.json', content: Buffer.from(JSON.stringify(manifest, null, 2), 'utf8') },
        ...files.map(({ name, content }) => ({ name: `files/${name}`, content })),
      ];
      const tarball = packTar(entries);
      return await gzip(tarball);
    },

    // Inverse of pack: decompress + extract. Returns the manifest object and
    // a map of file path → Buffer.
    async unpack({ archive }: { archive: Buffer }): Promise<{ manifest: object; files: Map<string, Buffer> }> {
      const tarball = await gunzip(archive);
      const entries = unpackTar(tarball);

      const manifestEntry = entries.find((e) => e.name === 'manifest.json');
      if (!manifestEntry) {
        throw new Error('Backup archive is missing manifest.json');
      }
      const manifest = JSON.parse(manifestEntry.content.toString('utf8')) as object;

      const files = new Map<string, Buffer>();
      for (const entry of entries) {
        if (entry.name.startsWith('files/')) {
          files.set(entry.name.slice('files/'.length), entry.content);
        }
      }
      return { manifest, files };
    },
  };
}

async function gzip(input: Buffer): Promise<Buffer> {
  // Wrap the entire pipeline in a Promise resolved by consuming the gzip stream
  // and concatenating chunks. Cleaner than the original pipeline+sink idiom and
  // works in any Node version.
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const gzip = createGzip();
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gzip.on('end', resolve);
    gzip.on('error', reject);
    Readable.from(input).on('error', reject).pipe(gzip);
  });
  return Buffer.concat(chunks);
}

async function gunzip(input: Buffer): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const gunzip = createGunzip();
    gunzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gunzip.on('end', resolve);
    gunzip.on('error', reject);
    Readable.from(input).on('error', reject).pipe(gunzip);
  });
  return Buffer.concat(chunks);
}

export type BackupPackagerService = ReturnType<typeof createBackupPackagerService>;
export { isNil };