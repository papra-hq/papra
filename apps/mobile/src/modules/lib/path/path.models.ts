export function getExtension(path: string): string | undefined {
  const parts = path.split('.');
  if (parts.length <= 1) {
    return undefined;
  }

  const extension = parts.at(-1)?.toLowerCase();

  if (extension === '') {
    return undefined;
  }

  return extension;
}
