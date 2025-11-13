import sharp from 'sharp';
import { extractImages, extractText, getDocumentProxy } from 'unpdf';
import { defineTextExtractor } from '../extractors.models';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';

export const pdfExtractorDefinition = defineTextExtractor({
  name: 'pdf',
  mimeTypes: ['application/pdf'],
  extract: async ({ arrayBuffer, config, logger }) => {
    const pdf = await getDocumentProxy(arrayBuffer);

    const { text, totalPages: pageCount } = await extractText(pdf, { mergePages: true });

    if (text && text.trim().length > 0) {
      return {
        content: text,
        subExtractorsUsed: ['pdf-text'],
      };
    }

    logger?.debug({ pageCount }, 'No text found in PDF, falling back to OCR on images.');

    const { extract, extractorType } = await createTesseractExtractor(config.tesseract);

    const imageTexts = [];
    const startOcrTime = Date.now();

    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
      const images = await extractImages(pdf, pageIndex);
      const imageCount = images.length;

      if (imageCount === 0) {
        logger?.debug({ pageIndex, pageCount }, 'No images found on PDF page for OCR.');
        continue;
      }

      logger?.debug({ pageIndex, pageCount, imageCount }, 'Extracted images from PDF page.');

      for (const [imageIndex, image] of images.entries()) {
        const startTime = Date.now();
        const imageBuffer = await sharp(image.data, {
          raw: { width: image.width, height: image.height, channels: image.channels },
        })
          .png()
          .toBuffer();

        const bufferDelay = Date.now() - startTime;
        logger?.debug({
          pageIndex,
          pageCount,
          imageIndex,
          imageCount,
          durationMs: bufferDelay,
          imageWidth: image.width,
          imageHeight: image.height,
          imageSizeBytes: image.data.length,
        }, 'Converted image to PNG buffer for OCR.');

        const imageText = await extract(imageBuffer);
        const ocrDelay = Date.now() - startTime - bufferDelay;
        logger?.debug({ pageIndex, pageCount, imageIndex, imageCount, durationMs: ocrDelay }, 'Extracted text from image using OCR.');
        imageTexts.push(imageText);
      }
    }

    const totalOcrDuration = Date.now() - startOcrTime;

    logger?.info({ pageCount, imagesProcessedCount: imageTexts.length, durationMs: totalOcrDuration }, 'Completed OCR on PDF images.');

    return {
      content: imageTexts.join('\n'),
      subExtractorsUsed: [extractorType],
    };
  },
});
