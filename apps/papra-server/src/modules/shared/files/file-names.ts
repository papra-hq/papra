import mime from 'mime-types';

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

  if (parts.length === 1) {
    return fileName;
  }

  const fileNameWithoutExtension = parts.slice(0, -1).join('.');

  return { fileNameWithoutExtension };
}

export function getDownloadFileName({ name, mimeType }: { name: string; mimeType: string }): string {
  // Skip generic mime types — appending `.bin` to a renamed document is more confusing than no extension
  if (mimeType === 'application/octet-stream') {
    return name;
  }

  const expectedExtension = mime.extension(mimeType);

  if (expectedExtension === false) {
    return name;
  }

  const { extension: currentExtension } = getExtension({ fileName: name });

  if (currentExtension?.toLowerCase() === expectedExtension) {
    return name;
  }

  return `${name}.${expectedExtension}`;
}
