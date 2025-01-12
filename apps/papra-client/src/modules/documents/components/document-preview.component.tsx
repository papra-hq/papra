import type { Document } from '../documents.types';
import { Card } from '@/modules/ui/components/card';
import { createQuery } from '@tanstack/solid-query';
import { type Component, createResource, Match, Suspense, Switch } from 'solid-js';
import { fetchDocumentFile } from '../documents.services';
import { PdfViewer } from './pdf-viewer.component';

const imageMimeType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const pdfMimeType = ['application/pdf'];
const txtLikeMimeType = ['text/plain', 'text/markdown', 'text/csv', 'text/html'];

function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

const TextFromBlob: Component<{ blob: Blob }> = (props) => {
  const [txt] = createResource(() => blobToString(props.blob));

  return (
    <Card class="p-6 overflow-auto max-h-800px max-w-full text-xs">
      <Suspense>
        <pre>{txt()}</pre>
      </Suspense>
    </Card>
  );
};

export const DocumentPreview: Component<{ document: Document }> = (props) => {
  const getIsImage = () => imageMimeType.includes(props.document.mimeType);
  const getIsPdf = () => pdfMimeType.includes(props.document.mimeType);

  const query = createQuery(() => ({
    queryKey: ['organizations', props.document.organizationId, 'documents', props.document.id, 'file'],
    queryFn: () => fetchDocumentFile({ documentId: props.document.id, organizationId: props.document.organizationId }),
  }));

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
        <Match when={txtLikeMimeType.includes(props.document.mimeType) && query.data}>
          <TextFromBlob blob={query.data!} />
        </Match>
      </Switch>
    </Suspense>
  );
};
