export function getExtension({ fileName }: { fileName: string }) {
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return { extension: undefined };
  }

  const extension = parts.at(-1);

  if (extension === '') {
    return { extension: undefined };
  }

  return { extension };
}

export function getFileNameWithoutExtension({ fileName }: { fileName: string }) {
  const parts = fileName.split('.');
  const dotCount = parts.length - 1;

  if (dotCount === 0) {
    return fileName;
  }

  if (dotCount === 1 && fileName.startsWith('.')) {
    return fileName;
  }

  return parts.slice(0, -1).join('.');
}
