export function generatePropertyKey({ name }: { name: string }): string {
  return name
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}
