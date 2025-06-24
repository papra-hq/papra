import { describe, expect, test } from 'vitest';
import { getLuminance } from './luminance';

describe('luminance', () => {
  describe('getLuminance', () => {
    test(`the relative luminance of a color is the relative brightness of any point in a color space, normalized to 0 for darkest black and 1 for lightest white
          the formula is: 0.2126 * R + 0.7152 * G + 0.0722 * B
          where R, G, B are the red, green, and blue channels of the color, normalized to 0-1 and gamma corrected (sRGB): 
          if the channel value is less than 0.03928, it is divided by 12.92, otherwise it is raised to the power of 2.4

          Source: https://www.w3.org/TR/WCAG20/#relativeluminancedef
      `, () => {
      expect(getLuminance('#000000')).toBe(0);
      expect(getLuminance('#FFFFFF')).toBe(1);
      expect(getLuminance('#FF0000')).toBeCloseTo(0.2126, 4);
      expect(getLuminance('#00FF00')).toBeCloseTo(0.7152, 4);
      expect(getLuminance('#0000FF')).toBeCloseTo(0.0722, 4);
    });
  });
});
