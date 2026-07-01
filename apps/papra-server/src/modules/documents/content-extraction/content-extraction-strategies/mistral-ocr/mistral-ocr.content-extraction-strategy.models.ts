import { fileToBase64DataUrl } from '../../../../shared/files/files';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';
import { IN_BYTES } from '../../../../shared/units';

export async function buildDocumentInfo({ file }: { file: File }) {
  const isImage = file.type.startsWith('image/');
  const dataUrl = await fileToBase64DataUrl(file);

  if (isImage) {
    return {
      type: 'image_url',
      image_url: dataUrl,
    };
  }

  return {
    type: 'document_url',
    document_url: dataUrl,
  };
}

export function isMistralOcrAbleToExtractTextFromDocument({
  file,
  mimeTypesAllowList,
}: {
  file: { type: string; size: number };
  mimeTypesAllowList: Set<string>;
}) {
  const isFormatSupported = isMimeTypeAllowed({
    mimeType: file.type,
    allowList: mimeTypesAllowList,
  });

  const isBelowSizeLimit = file.size < 50 * IN_BYTES.MEGABYTE;

  return isBelowSizeLimit && isFormatSupported;
}
