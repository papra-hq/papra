import type { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

export async function collectStreamToFile({ fileStream, fileName, mimeType }: { fileStream: ReadableStream | Readable; fileName: string; mimeType: string }): Promise<{ file: File }> {
  const response = new Response(fileStream);
  const blob = await response.blob();

  const file = new File([blob], fileName, { type: mimeType });

  return { file };
}
