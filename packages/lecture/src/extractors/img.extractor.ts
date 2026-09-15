import sharp from 'sharp';
import { defineTextExtractor } from '../extractors.models';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';
import type { Logger } from '../types';

async function normalizeImageRotation(
  arrayBuffer: ArrayBuffer,
  { logger }: { logger?: Logger },
): Promise<Buffer | ArrayBuffer> {
  try {
    const image = sharp(arrayBuffer);
    const { orientation } = await image.metadata();
    const shouldNormalizeRotation = orientation !== undefined && orientation !== 1;
    return shouldNormalizeRotation ? await image.rotate().toBuffer() : arrayBuffer;
  } catch (error) {
    logger?.error(
      { error },
      'Failed to normalize image rotation, trying to extract text from the original image',
    );
    return arrayBuffer;
  }
}

export const imageExtractorDefinition = defineTextExtractor({
  name: 'image',
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  extract: async ({ arrayBuffer, config, logger }) => {
    const { extract, extractorType } = await createTesseractExtractor(config.tesseract);

    const normalizedImage = await normalizeImageRotation(arrayBuffer, { logger });

    const content = await extract(normalizedImage);

    return {
      content,
      subExtractorsUsed: [extractorType],
    };
  },
});
