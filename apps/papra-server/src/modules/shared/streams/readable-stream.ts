import { Readable } from 'node:stream';

export async function collectReadableStreamToString({ stream }: { stream: ReadableStream | Readable }) {
  return new Response(stream).text();
}

export function fileToReadableStream(file: File) {
  return Readable.fromWeb(file.stream());
}

export function createReadableStream({ content }: { content: string }) {
  const stream = new Readable();
  stream.push(content);
  stream.push(null);

  return stream;
}
