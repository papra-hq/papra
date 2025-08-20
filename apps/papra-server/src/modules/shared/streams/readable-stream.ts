import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

export async function collectReadableStreamToBuffer({ stream }: { stream: ReadableStream | Readable }) {
  return Buffer.concat(await Array.fromAsync(stream));
}

export async function collectReadableStreamToString({ stream }: { stream: ReadableStream | Readable }) {
  const buffer = await collectReadableStreamToBuffer({ stream });

  return buffer.toString('utf-8');
}

export function fileToReadableStream(file: File) {
  return Readable.fromWeb(file.stream());
}

export function createReadableStream({ content }: { content: string | Buffer }) {
  const stream = new Readable();
  stream.push(content);
  stream.push(null);

  return stream;
}
