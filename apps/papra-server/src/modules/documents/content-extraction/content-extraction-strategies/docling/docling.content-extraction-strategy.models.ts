export function stripDoclingImagePlaceholders(text: string): string {
  return text.replaceAll('<!-- image -->', '').trim();
}
