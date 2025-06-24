import { describe, expect, test } from 'vitest';
import { getRgbChannelsFromHex } from './color-formats';

describe('color-formats', () => {
  describe('getRgbChannelsFromHex', () => {
    test('extracts the rgb channels values from a hex color', () => {
      expect(getRgbChannelsFromHex('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(getRgbChannelsFromHex('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(getRgbChannelsFromHex('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(getRgbChannelsFromHex('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(getRgbChannelsFromHex('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(getRgbChannelsFromHex('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('is case insensitive', () => {
      expect(getRgbChannelsFromHex('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(getRgbChannelsFromHex('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(getRgbChannelsFromHex('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('returns 0, 0, 0 for invalid colors', () => {
      expect(getRgbChannelsFromHex('lorem')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });
});
