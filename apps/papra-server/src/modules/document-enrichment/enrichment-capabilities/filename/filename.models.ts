import { extname } from 'node:path';

export const DEFAULT_FILENAME_PROMPT = `Generate a concise, descriptive filename from the document text.
Use the document's language for the sender, document type and short subject.
Format: YYYY-MM-DD_Sender_DocumentType_ShortSubject.ext
Use the document's issue date, not an incident date, deadline or scanning date. If no reliable issue date is present, use undated.
Sender: short name of the issuing organization or person, not the recipient.
ShortSubject: 2–5 informative words, without repeating the sender or document type.
Omit unknown fields except the date. Do not invent information.
Use underscores instead of spaces and preserve Unicode characters.
Use the supplied file extension exactly once. Do not infer information from filenames.
Return the proposed filename in the filename field of the response.`;

export function getDocumentExtension(name: string) {
  const extension = extname(name).replace(/[^.\p{L}\p{N}_-]/gu, '');
  return extension.toLowerCase() === '.pdf' ? '.pdf' : extension;
}

// The model proposes a basename; the application owns path safety and extension preservation.
export function normalizeGeneratedFilename({
  filename,
  originalName,
}: {
  filename: string;
  originalName: string;
}) {
  const extension = getDocumentExtension(originalName);
  if (Buffer.byteLength(extension, 'utf8') >= 240) {
    return undefined;
  }
  let base = filename
    .normalize('NFC')
    .trim()
    // eslint-disable-next-line no-control-regex -- Filenames must not contain control characters.
    .replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
  while (extension && base.toLowerCase().endsWith(extension.toLowerCase())) {
    base = base.slice(0, -extension.length);
  }
  base = base.replace(/_+/g, '_').replace(/^[._ -]+|[._ -]+$/g, '');
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base)) {
    base = `_${base}`;
  }
  // Reserve space for the extension within common filesystem byte limits.
  while (Buffer.byteLength(base + extension, 'utf8') > 240) {
    base = Array.from(base).slice(0, -1).join('');
  }
  base = base.replace(/[._ -]+$/g, '');
  if (!base) {
    return undefined;
  }

  return base + extension;
}
