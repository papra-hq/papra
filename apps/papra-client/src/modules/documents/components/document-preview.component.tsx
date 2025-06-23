import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { useQuery } from '@tanstack/solid-query';
import { createResource, Match, Suspense, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Card } from '@/modules/ui/components/card';
import { fetchDocumentFile } from '../documents.services';
import { PdfViewer } from './pdf-viewer.component';

const imageMimeType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const pdfMimeType = ['application/pdf'];
const txtLikeMimeType = ['application/x-yaml', 'application/json', 'application/xml'];

function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

/**
 * TODO: IA generated code, add some tests
 * Detects if a blob can be safely displayed as text by checking for valid UTF-8 encoding
 * and common text patterns (low ratio of control characters, presence of readable text)
 */
async function isBlobTextSafe(blob: Blob): Promise<boolean> {
  try {
    const text = await blobToString(blob);

    // Check if the text contains mostly printable characters
    const totalChars = text.length;
    if (totalChars === 0) {
      return true;
    } // Empty files are considered text-safe

    // Count control characters (excluding common whitespace and newlines)
    // Use a simpler approach to avoid linter issues with Unicode escapes
    let controlCharCount = 0;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // Check for control characters (0-31, 127-159) excluding common whitespace
      if ((charCode >= 0 && charCode <= 31 && ![9, 10, 13, 12, 11].includes(charCode))
        || (charCode >= 127 && charCode <= 159)) {
        controlCharCount++;
      }
    }

    // If more than 10% of characters are control characters, it's likely binary
    const controlCharRatio = controlCharCount / totalChars;
    if (controlCharRatio > 0.1) {
      return false;
    }

    // Check for common binary file signatures in the first few bytes
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Common binary file signatures to check
    const binarySignatures = [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0x47, 0x49, 0x46], // GIF
      [0x25, 0x50, 0x44, 0x46], // PDF
      [0x50, 0x4B, 0x03, 0x04], // ZIP/DOCX/XLSX
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0x4D, 0x5A], // Windows executable
    ];

    for (const signature of binarySignatures) {
      if (uint8Array.length >= signature.length) {
        const matches = signature.every((byte, index) => uint8Array[index] === byte);
        if (matches) {
          return false;
        }
      }
    }

    // Check if the text contains mostly ASCII printable characters
    let asciiPrintableCount = 0;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // ASCII printable characters (32-126) excluding common whitespace
      if (charCode >= 32 && charCode <= 126 && ![9, 10, 13, 12, 11].includes(charCode)) {
        asciiPrintableCount++;
      }
    }

    const asciiRatio = asciiPrintableCount / totalChars;

    // If less than 70% are ASCII printable, it's likely binary
    return asciiRatio > 0.7;
  } catch {
    // If we can't read as text, it's definitely not text-safe
    return false;
  }
}

const TextFromBlob: Component<{ blob: Blob }> = (props) => {
  const [txt] = createResource(() => blobToString(props.blob));

  return (
    <Card class="p-6 overflow-auto max-h-800px max-w-full text-xs">
      <Suspense>
        <pre class="break-words whitespace-pre-wrap">{txt()}</pre>
      </Suspense>
    </Card>
  );
};

export const DocumentPreview: Component<{ document: Document }> = (props) => {
  const getIsImage = () => imageMimeType.includes(props.document.mimeType);
  const getIsPdf = () => pdfMimeType.includes(props.document.mimeType);
  const getIsTxtLike = () => txtLikeMimeType.includes(props.document.mimeType) || props.document.mimeType.startsWith('text/');
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', props.document.organizationId, 'documents', props.document.id, 'file'],
    queryFn: () => fetchDocumentFile({ documentId: props.document.id, organizationId: props.document.organizationId }),
  }));

  // Create a resource to check if octet-stream blob is text-safe
  const [isOctetStreamTextSafe] = createResource(
    () => query.data && props.document.mimeType === 'application/octet-stream' ? query.data : null,
    async (blob) => {
      if (!blob) {
        return false;
      }
      return await isBlobTextSafe(blob);
    },
  );

  return (
    <Suspense>
      <Switch>
        <Match when={getIsImage() && query.data}>
          <div>
            <img src={URL.createObjectURL(query.data!)} class="w-full h-full object-contain" />
          </div>
        </Match>

        <Match when={getIsPdf() && query.data}>
          <PdfViewer url={URL.createObjectURL(query.data!)} />
        </Match>

        <Match when={getIsTxtLike() && query.data}>
          <TextFromBlob blob={query.data!} />
        </Match>

        <Match when={props.document.mimeType === 'application/octet-stream' && query.data && isOctetStreamTextSafe()}>
          <TextFromBlob blob={query.data!} />
        </Match>

        <Match when={props.document.mimeType === 'application/octet-stream' && query.data && !isOctetStreamTextSafe()}>
          <Card class="px-6 py-12 text-center text-sm text-muted-foreground">
            <p>{t('documents.preview.binary-file')}</p>
          </Card>
        </Match>

        <Match when={query.data}>
          <Card class="px-6 py-12 text-center text-sm text-muted-foreground">
            <p>{t('documents.preview.unknown-file-type')}</p>
          </Card>
        </Match>
      </Switch>
    </Suspense>
  );
};
