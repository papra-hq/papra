import { defineTextExtractor } from '../extractors.models';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';

export const imageExtractorDefinition = defineTextExtractor({
  name: 'image',
  mimeTypes: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
  ],
  extract: async ({ arrayBuffer, config }) => {
    const { extract, extractorType } = await createTesseractExtractor(config.tesseract);

    const content = await extract(arrayBuffer);

    return {
      content,
      subExtractorsUsed: [extractorType],
    };
  },
});
