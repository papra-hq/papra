import type { PDFDocumentProxy } from 'unpdf/pdfjs';
import type { Logger } from '../types';
import { Buffer } from 'node:buffer';
import canvas from '@napi-rs/canvas';
import sharp from 'sharp';
import { extractImages, extractText, getDocumentProxy, renderPageAsImage } from 'unpdf';
import { defineTextExtractor } from '../extractors.models';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';

type OcrExtract = (imageBuffer: Buffer) => Promise<string>;

async function extractPdfText({ pdf }: { pdf: PDFDocumentProxy }) {
  const { text, totalPages: pageCount } = await extractText(pdf, { mergePages: true });

  return {
    text: text?.trim().length > 0 ? text : undefined,
    pageCount,
  };
}

async function ocrPdfEmbeddedImages({ pdf, pageCount, extract, logger }: { pdf: PDFDocumentProxy; pageCount: number; extract: OcrExtract; logger?: Logger }) {
  const imageTexts: string[] = [];

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

  return { imageTexts };
}

async function ocrPdfRenderedPages({ pdf, pageCount, extract, logger }: { pdf: PDFDocumentProxy; pageCount: number; extract: OcrExtract; logger?: Logger }) {
  const renderedTexts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    const startTime = Date.now();
    const pageImage = await renderPageAsImage(pdf, pageIndex, {
      canvasImport: async () => canvas,
      scale: 2,
    });

    const renderDelay = Date.now() - startTime;
    logger?.debug({ pageIndex, pageCount, durationMs: renderDelay }, 'Rendered PDF page as image for OCR.');

    const pageText = await extract(Buffer.from(pageImage));
    const ocrDelay = Date.now() - startTime - renderDelay;
    logger?.debug({ pageIndex, pageCount, durationMs: ocrDelay }, 'Extracted text from rendered page using OCR.');
    renderedTexts.push(pageText);
  }

  return { renderedTexts };
}

export const pdfExtractorDefinition = defineTextExtractor({
  name: 'pdf',
  mimeTypes: ['application/pdf'],
  extract: async ({ arrayBuffer, config, logger }) => {
    const pdf = await getDocumentProxy(arrayBuffer);

    const { text, pageCount } = await extractPdfText({ pdf });

    if (text) {
      return {
        content: text,
        subExtractorsUsed: ['pdf-text'],
      };
    }

    logger?.debug({ pageCount }, 'No text found in PDF, falling back to OCR on images.');

    const { extract, extractorType } = await createTesseractExtractor(config.tesseract);

    const { imageTexts } = await ocrPdfEmbeddedImages({ pdf, pageCount, extract, logger });

    if (imageTexts.length > 0) {
      logger?.info({ pageCount, imagesProcessedCount: imageTexts.length }, 'Completed OCR on PDF images.');

      return {
        content: imageTexts.join('\n'),
        subExtractorsUsed: [extractorType],
      };
    }

    logger?.debug({ pageCount }, 'No images found in PDF, falling back to page rendering for OCR.');

    const { renderedTexts } = await ocrPdfRenderedPages({ pdf, pageCount, extract, logger });

    logger?.info({ pageCount, pagesRendered: renderedTexts.length }, 'Completed OCR on rendered PDF pages.');

    return {
      content: renderedTexts.join('\n'),
      subExtractorsUsed: [extractorType],
    };
  },
});
