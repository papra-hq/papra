import type { Document } from '../documents.types';
import { createQuery } from '@tanstack/solid-query';
import { type Component, Match, Suspense, Switch } from 'solid-js';
import { fetchDocumentFile } from '../documents.services';
import { PdfViewer } from './pdf-viewer.component';

const imageMimeType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const pdfMimeType = ['application/pdf'];

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
      </Switch>
    </Suspense>
  );
};
