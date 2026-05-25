import type { PDFDocumentProxy } from 'unpdf/pdfjs';
import type { Logger } from '../types';
import { Buffer } from 'node:buffer';
import canvas from '@napi-rs/canvas';
import { extractText, getDocumentProxy, getResolvedPDFJS, renderPageAsImage } from 'unpdf';
import { defineTextExtractor } from '../extractors.models';
import { isValidPdfImage } from '../pdf/pdf.models';
import { pdfImageToBuffer } from '../pdf/pdf.usecases';
import { createTesseractExtractor } from '../tesseract/tesseract.usecases';

type OcrExtract = (imageBuffer: Buffer) => Promise<string>;

async function extractPdfText({ pdf }: { pdf: PDFDocumentProxy }) {
  const { text, totalPages: pageCount } = await extractText(pdf, { mergePages: true });

  return {
    text: text?.trim().length > 0 ? text : undefined,
    pageCount,
  };
}

// Inspired by unpdf's extractImages helper with added support for 1-bit grayscale images
async function ocrPdfImages({ pdf, pageCount, extract, logger }: { pdf: PDFDocumentProxy; pageCount: number; extract: OcrExtract; logger?: Logger }) {
  const { OPS } = await getResolvedPDFJS();
  const imageTexts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    const operatorList = await page.getOperatorList();
    let pageImageCount = 0;

    for (let opIndex = 0; opIndex < operatorList.fnArray.length; opIndex++) {
      if (operatorList.fnArray[opIndex] !== OPS.paintImageXObject) {
        continue;
      }

      const imageKey = operatorList.argsArray[opIndex][0];

      if (!imageKey || typeof imageKey !== 'string') {
        logger?.warn({ pageIndex, pageCount, opIndex, imageKey }, 'Skipping PDF image with invalid image key for OCR.');
        continue;
      }

      const image = await new Promise(resolve => (imageKey.startsWith('g_') ? page.commonObjs : page.objs).get(imageKey, resolve));

      if (!isValidPdfImage(image)) {
        const get = (prop: string) => (image != null && typeof image === 'object' && prop in image ? image[prop] : undefined);

        logger?.warn({
          pageIndex,
          pageCount,
          imageKey,
          imageWidth: get('width'),
          imageHeight: get('height'),
          imageKind: get('kind'),
        }, 'Skipping unsupported PDF image for OCR.');
        continue;
      }

      pageImageCount++;
      logger?.debug({ pageIndex, pageCount, imageKey, imageWidth: image.width, imageHeight: image.height, imageKind: image.kind }, 'Extracting image from PDF page for OCR.');

      const startTime = Date.now();
      const imageBuffer = await pdfImageToBuffer(image);
      logger?.debug({ pageIndex, pageCount, durationMs: Date.now() - startTime }, 'Converted PDF image to PNG buffer for OCR.');

      const imageText = await extract(imageBuffer);
      imageTexts.push(imageText);
    }

    if (pageImageCount === 0) {
      logger?.debug({ pageIndex, pageCount }, 'No images found on PDF page for OCR.');
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

    const { imageTexts } = await ocrPdfImages({ pdf, pageCount, extract, logger });

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
