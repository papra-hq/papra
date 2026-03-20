import type { Buffer } from 'node:buffer';
import type { PdfRawImage } from './pdf.types';
import sharp from 'sharp';
import { IMAGE_KIND, IMAGE_KIND_CHANNELS } from './pdf.constants';

export function getNormalizedImageData(image: PdfRawImage): Uint8Array {
  if (image.kind === IMAGE_KIND.GRAYSCALE_1BPP) {
    // Unpack 1-bit per pixel (MSB first) into 8-bit grayscale: bit 1 = white (255), bit 0 = black (0)
    // PDF 1bpp scanlines are byte-aligned: each row occupies ceil(width/8) bytes,
    // with unused padding bits at the end of each row that must be skipped.
    const unpacked = new Uint8Array(image.width * image.height);
    const rowBytes = Math.ceil(image.width / 8);

    for (let y = 0; y < image.height; y++) {
      const rowOffset = y * rowBytes;
      for (let x = 0; x < image.width; x++) {
        const byte = image.data[rowOffset + (x >> 3)] ?? 0;
        unpacked[y * image.width + x] = ((byte >> (7 - (x & 7))) & 1) ? 255 : 0;
      }
    }
    return unpacked;
  }

  return image.data;
}

export async function pdfImageToBuffer(image: PdfRawImage): Promise<Buffer> {
  const imageData = getNormalizedImageData(image);

  return sharp(imageData, {
    raw: {
      width: image.width,
      height: image.height,
      channels: IMAGE_KIND_CHANNELS[image.kind],
    },
  })
    .png()
    .toBuffer();
}
