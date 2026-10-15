import { getExtension } from '../shared/files/file-names';

export function buildAutoNamingInstructions({ maxTitleLength }: { maxTitleLength: number }) {
  return [
    `A short, descriptive title in the language of the document, like "Invoice - Acme Corp - March 2026". At most ${maxTitleLength} characters, without a file extension.`,
  ];
}

export type AutoNamingResponse = {
  title?: string;
};

const DOCUMENT_NAME_MAX_LENGTH = 255;

// Mirrors the client rename dialog: a single leading dot (e.g. ".env") is not an extension
function getNameExtension({ name }: { name: string }) {
  const isDotFile = name.startsWith('.') && !name.includes('.', 1);

  return isDotFile ? undefined : getExtension({ fileName: name }).extension;
}

export function getTitleAction({
  autoNamingResponse,
  currentName,
  originalName,
  maxTitleLength,
}: {
  autoNamingResponse: AutoNamingResponse;
  currentName: string;
  originalName?: string;
  maxTitleLength: number;
}) {
  // The LLM response is not runtime-validated, so defend against non-string titles
  const rawTitle = typeof autoNamingResponse.title === 'string' ? autoNamingResponse.title : '';

  // Like a manual rename, the extension of the current name is kept so downloads keep their file type,
  // falling back to the original file name for documents whose name lost its extension
  const extension =
    getNameExtension({ name: currentName }) ??
    (originalName ? getNameExtension({ name: originalName }) : undefined);
  const extensionSuffix = extension ? `.${extension}` : '';

  const sanitizedTitle = rawTitle
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F]+/g, ' ')
    .trim()
    .replace(/^["']+/g, '')
    .replace(/["'.]+$/g, '')
    .trim();

  const hasExtension =
    extensionSuffix !== '' && sanitizedTitle.toLowerCase().endsWith(extensionSuffix.toLowerCase());

  const baseTitle = (
    hasExtension ? sanitizedTitle.slice(0, -extensionSuffix.length) : sanitizedTitle
  )
    .trim()
    .slice(0, Math.min(maxTitleLength, DOCUMENT_NAME_MAX_LENGTH - extensionSuffix.length))
    .trim();

  if (baseTitle.length === 0) {
    return { shouldRename: false, title: '' };
  }

  const title = `${baseTitle}${extensionSuffix}`;

  return { shouldRename: title !== currentName, title };
}
