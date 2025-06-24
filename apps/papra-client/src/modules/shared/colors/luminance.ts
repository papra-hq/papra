import { getRgbChannelsFromHex } from './color-formats';

// https://www.w3.org/TR/WCAG20/#relativeluminancedef
export function getLuminance(color: string) {
  const { r, g, b } = getRgbChannelsFromHex(color);

  const toLinear = (channelValue: number) => {
    const normalized = channelValue / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
