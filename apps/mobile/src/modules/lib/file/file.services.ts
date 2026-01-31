import * as FileSystem from 'expo-file-system/legacy';
import { getExtension } from '../path/path.models';

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
}): string | undefined {
  if (extension === undefined) {
    return fallbackMimeType;
  }

  return mimeTypes[extension] ?? fallbackMimeType;
}

export async function fileToBase64DataUrl({ fileUri }: { fileUri: string }) {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

  const extension = getExtension(fileUri);
  const mimeType = getMimeTypeForExtension({ extension });

  const base64DataUrl = `data:${mimeType};base64,${base64}`;

  return base64DataUrl;
}
