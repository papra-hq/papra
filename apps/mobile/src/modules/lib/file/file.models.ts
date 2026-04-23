// At the moment, only these mime types are needed, will switch to mime-db if needed later
const mimeTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
};

export function getMimeTypeForExtension({
  extension,
  fallbackMimeType = 'application/octet-stream',
}: {
  extension: string | undefined;
  fallbackMimeType?: string;
}): string {
  if (extension === undefined) {
    return fallbackMimeType;
  }

  return mimeTypes[extension] ?? fallbackMimeType;
}
