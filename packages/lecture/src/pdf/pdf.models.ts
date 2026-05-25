import type { PdfRawImage } from './pdf.types';
import { IMAGE_KIND_CHANNELS } from './pdf.constants';

export function isValidPdfImage(image: unknown): image is PdfRawImage {
  return Boolean(image)
    && typeof image === 'object'
    && 'data' in image
    && 'width' in image
    && typeof image.width === 'number'
    && 'height' in image
    && typeof image.height === 'number'
    && 'kind' in image
    && typeof image.kind === 'number'
    && image.kind in IMAGE_KIND_CHANNELS;
}
