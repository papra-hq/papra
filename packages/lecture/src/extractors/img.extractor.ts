import { Buffer } from 'node:buffer';
import { createWorker } from 'tesseract.js';
import { defineTextExtractor } from '../extractors.models';

export async function extractTextFromImage(maybeArrayBuffer: ArrayBuffer | Buffer, { languages }: { languages: string[] }) {
  const buffer = maybeArrayBuffer instanceof ArrayBuffer ? Buffer.from(maybeArrayBuffer) : maybeArrayBuffer;

  const worker = await createWorker(languages);

  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();

  return text;
}

export const imageExtractorDefinition = defineTextExtractor({
  name: 'image',
  mimeTypes: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
  ],
  extract: async ({ arrayBuffer, config }) => {
    const { languages } = config.tesseract;

    const content = await extractTextFromImage(arrayBuffer, { languages });

    return { content };
  },
});
