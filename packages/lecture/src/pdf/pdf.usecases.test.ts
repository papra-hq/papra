import { describe, expect, test } from 'vitest';
import { IMAGE_KIND } from './pdf.constants';
import { getNormalizedImageData } from './pdf.usecases';

describe('getNormalizedImageData', () => {
  describe('for GRAYSCALE_1BPP images, unpacks packed bits into one byte per pixel so that sharp can process the image', () => {
    test('each bit maps to 0 (black) or 255 (white), MSB first', () => {
      // width=8, height=2: no padding, each row is exactly 1 byte
      const image = {
        data: new Uint8Array([0xFF, 0x00]),
        width: 8,
        height: 2,
        kind: IMAGE_KIND.GRAYSCALE_1BPP,
      };

      const result = getNormalizedImageData(image);

      expect(Array.from(result)).toEqual([
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255, // row 0: all white
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // row 1: all black
      ]);
    });

    test(
      'padding bits at the end of each row are skipped — '
      + 'PDF 1bpp scanlines are byte-aligned (ceil(width/8) bytes per row), '
      + 'so images whose width is not a multiple of 8 carry unused bits '
      + 'that must not bleed into the next row',
      () => {
        // width=9, height=2: 2 bytes per row, 7 padding bits at end of each row
        // Row 0: [0x00, 0x00] → 9 black pixels, 7 padding bits ignored
        // Row 1: [0xFF, 0x80] → 9 white pixels, 7 padding bits ignored
        const image = {
          data: new Uint8Array([0x00, 0x00, 0xFF, 0x80]),
          width: 9,
          height: 2,
          kind: IMAGE_KIND.GRAYSCALE_1BPP,
        };

        const result = getNormalizedImageData(image);

        expect(Array.from(result)).toEqual([
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0, // row 0: all black
          255,
          255,
          255,
          255,
          255,
          255,
          255,
          255,
          255, // row 1: all white
        ]);
      },
    );
  });

  test('passes image data through unchanged for non-1bpp formats (RGB, RGBA) since they are already byte-per-channel', () => {
    const data = new Uint8Array([255, 0, 0, 0, 255, 0]);
    const image = { data, width: 2, height: 1, kind: IMAGE_KIND.RGB_24BPP };

    expect(getNormalizedImageData(image)).toBe(data);
  });
});
