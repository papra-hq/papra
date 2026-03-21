export const IMAGE_KIND = {
  GRAYSCALE_1BPP: 1,
  RGB_24BPP: 2,
  RGBA_32BPP: 3,
} as const;

export const IMAGE_KIND_CHANNELS: Record<number, 1 | 3 | 4> = {
  [IMAGE_KIND.GRAYSCALE_1BPP]: 1,
  [IMAGE_KIND.RGB_24BPP]: 3,
  [IMAGE_KIND.RGBA_32BPP]: 4,
};
