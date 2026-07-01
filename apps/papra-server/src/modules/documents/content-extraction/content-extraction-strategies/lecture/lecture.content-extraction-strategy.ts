import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { extractTextFromFile } from '@papra/lecture';

export function buildLectureContentExtractionStrategy(): ContentExtractionStrategy {
  return {
    canExtractTextFromDocument: async () => true,

    extractTextFromDocument: async ({ file, ocrLanguages }) => {
      const { textContent, extractorType } = await extractTextFromFile({
        file,
        config: { tesseract: { languages: ocrLanguages } },
      });

      return {
        text: textContent ?? '',
        extractionContext: { extractorType },
      };
    },
  };
}
