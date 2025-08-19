import type { Logger } from '@crowlog/logger';
import { extractTextFromFile } from '@papra/lecture';
import { createLogger } from '../shared/logger/logger';
import { getStreamSha256Hash } from '../shared/streams/stream-hash';

export async function getFileHash({ fileStream }: { fileStream: ReadableStream<Uint8Array> }) {
  const { hash } = await getStreamSha256Hash({ stream: fileStream });

  return { hash };
}

export async function extractDocumentText({
  file,
  ocrLanguages,
  logger = createLogger({ namespace: 'documents:services' }),
}: {
  file: File;
  ocrLanguages?: string[];
  logger?: Logger;
}) {
  const { textContent, error, extractorName } = await extractTextFromFile({ file, config: { tesseract: { languages: ocrLanguages } } });

  if (error) {
    logger.error({ error, extractorName }, 'Error while extracting text from document');
  }

  return {
    text: textContent ?? '',
  };
}
