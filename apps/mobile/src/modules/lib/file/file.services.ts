import * as FileSystem from 'expo-file-system/legacy';
import { getExtension } from '../path/path.models';
import { getMimeTypeForExtension } from './file.models';

export async function fileToBase64DataUrl({ fileUri }: { fileUri: string }) {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

  const extension = getExtension(fileUri);
  const mimeType = getMimeTypeForExtension({ extension });

  const base64DataUrl = `data:${mimeType};base64,${base64}`;

  return base64DataUrl;
}
