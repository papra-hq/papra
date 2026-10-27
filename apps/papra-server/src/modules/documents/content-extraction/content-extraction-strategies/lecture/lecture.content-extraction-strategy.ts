import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { extractTextFromFile } from '@papra/lecture';

export function buildLectureContentExtractionStrategy(): ContentExtractionStrategy {
  return {
    canExtractTextFromDocument: async () => true,

    extractTextFromDocument: async ({ file, ocrLanguages, logger }) => {
      const { textContent, extractorType } = await extractTextFromFile({
        file,
        config: { tesseract: { languages: ocrLanguages } },
        logger,
      });

      return {
        text: textContent ?? '',
        extractionContext: { extractorType },
      };
    },
  };
}
