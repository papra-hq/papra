export const FFFFFF_IN_DECIMAL = 16777215;

export function getRgbChannelsFromHex(color: string) {
  const [r, g, b] = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)?.slice(1).map(c => Number.parseInt(c, 16)) ?? [0, 0, 0];

  return { r, g, b };
}
