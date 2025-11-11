import sharp from 'sharp';
import { extractImages, extractText, getDocumentProxy } from 'unpdf';
import { defineTextExtractor } from '../extractors.models';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';

export const pdfExtractorDefinition = defineTextExtractor({
  name: 'pdf',
  mimeTypes: ['application/pdf'],
  extract: async ({ arrayBuffer, config }) => {
    const pdf = await getDocumentProxy(arrayBuffer);

    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    if (text && text.trim().length > 0) {
      return {
        content: text,
        subExtractorsUsed: ['pdf-text'],
      };
    }

    const { extract, extractorType } = await createTesseractExtractor(config.tesseract);

    const imageTexts = [];

    for (let i = 1; i <= totalPages; i++) {
      const images = await extractImages(pdf, i);

      for (const image of images) {
        const imageBuffer = await sharp(image.data, {
          raw: { width: image.width, height: image.height, channels: image.channels },
        })
          .png()
          .toBuffer();

        const imageText = await extract(imageBuffer);
        imageTexts.push(imageText);
      }
    }

    return {
      content: imageTexts.join('\n'),
      subExtractorsUsed: [extractorType],
    };
  },
});
