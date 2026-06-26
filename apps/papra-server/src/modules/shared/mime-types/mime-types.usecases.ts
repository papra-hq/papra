import { safely } from '@corentinth/chisels';
import { fileTypeStream } from 'file-type';
import { getMimeTypeFromFileName } from './mime-types.models';
import { Readable } from 'node:stream';
import { MIME_TYPES } from './mime-types.constants';

export async function coerceMimeTypeStream({
  fileStream,
  fileName,
  declaredMimeType,
}: {
  fileStream: Readable;
  fileName: string;
  declaredMimeType?: string;
}): Promise<{ stream: Readable; mimeType: string }> {
  const iterator = fileStream[Symbol.asyncIterator]();

  const safeStream = new ReadableStream<Uint8Array>({
    type: 'bytes',
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value instanceof Uint8Array ? new Uint8Array(value) : Buffer.from(value));
    },
  });

  const [detectedStream] = await safely(fileTypeStream(safeStream));

  const mimeType =
    detectedStream?.fileType?.mime ??
    (declaredMimeType && declaredMimeType !== MIME_TYPES.OCTET_STREAM
      ? declaredMimeType
      : getMimeTypeFromFileName(fileName));

  return {
    stream: detectedStream ? Readable.fromWeb(detectedStream) : fileStream,
    mimeType,
  };
}
