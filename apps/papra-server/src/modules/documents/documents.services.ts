import type { Logger } from '@crowlog/logger';
import { extractTextFromFile } from '@papra/lecture';
import { createLogger } from '../shared/logger/logger';

export async function getFileSha256Hash({ file }: { file: File }) {
  const arrayBuffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashHex = Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    hash: hashHex,
  };
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
