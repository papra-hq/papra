import sharp from 'sharp';
import { extractImages, extractText, getDocumentProxy } from 'unpdf';
import { defineTextExtractor } from '../extractors.models';
import { extractTextFromImage } from './img.extractor';

export const pdfExtractorDefinition = defineTextExtractor({
  name: 'pdf',
  mimeTypes: ['application/pdf'],
  extract: async ({ arrayBuffer, config }) => {
    const { languages } = config.tesseract;

    const pdf = await getDocumentProxy(arrayBuffer);

    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    if (text && text.trim().length > 0) {
      return { content: text };
    }

    const imageTexts = [];

    for (let i = 1; i <= totalPages; i++) {
      const images = await extractImages(pdf, i);

      for (const image of images) {
        const imageBuffer = await sharp(image.data, {
          raw: { width: image.width, height: image.height, channels: image.channels },
        })
          .png()
          .toBuffer();

        const imageText = await extractTextFromImage(imageBuffer, { languages });
        imageTexts.push(imageText);
      }
    }

    return { content: imageTexts.join('\n') };
  },
});
