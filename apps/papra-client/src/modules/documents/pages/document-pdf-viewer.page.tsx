import type { Component } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { lazy, onCleanup, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { fetchDocument, fetchDocumentFile } from '../documents.services';

const PdfViewer = lazy(() => import('../components/pdf-viewer/full-pdf-viewer.component').then(m => ({ default: m.PdfViewer })));

const pdfMimeTypes = ['application/pdf'];

export const DocumentPdfViewerPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();

  const documentQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', params.documentId],
    queryFn: () => fetchDocument({ documentId: params.documentId, organizationId: params.organizationId }),
  }));

  const documentFileQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', params.documentId, 'file'],
    queryFn: () => fetchDocumentFile({ documentId: params.documentId, organizationId: params.organizationId }),
  }));

  const getIsPdf = () => {
    const document = documentQuery.data?.document;
    return document ? pdfMimeTypes.includes(document.mimeType) : false;
  };

  const getDataUrl = () => documentFileQuery.data ? URL.createObjectURL(documentFileQuery.data) : undefined;

  onCleanup(() => {
    const dataUrl = getDataUrl();
    if (dataUrl) {
      URL.revokeObjectURL(dataUrl);
    }
  });

  return (
    <div class="flex flex-col h-screen overflow-hidden">
      <Suspense
        fallback={(
          <div class="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div class=" i-tabler-loader-2 size-8 animate-spin mb-2" />
            <div>{t('documents.pdf-viewer.loading')}</div>
          </div>
        )}
      >
        <Show
          when={getIsPdf()}
          fallback={(
            <div class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <div class="i-tabler-file-alert size-12 mx-auto mb-4 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">{t('documents.pdf-viewer.not-a-pdf')}</p>
              </div>
            </div>
          )}
        >
          <div class="flex items-center justify-between pl-3 pr-1 py-2 border-b bg-card shrink-0">
            <div class="flex items-center gap-2">
              <div class="i-tabler-file-type-pdf size-5 text-muted-foreground" />
              <span class="text-sm font-medium truncate">{documentQuery.data?.document.name}</span>
            </div>

            <Button as={A} href={`/organizations/${params.organizationId}/documents/${params.documentId}`} variant="ghost" size="icon">
              <div class="i-tabler-x size-4" />
            </Button>
          </div>

          <div class="flex-1 min-h-0">
            <Show when={getDataUrl()}>
              {url => (
                <PdfViewer url={url()} />
              )}
            </Show>
          </div>
        </Show>
      </Suspense>
    </div>
  );
};
