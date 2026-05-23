import type { Component } from 'solid-js';
import { usePdfViewer } from './use-pdf-viewer';

export const SimplePdfViewer: Component<{ url: string }> = (props) => {
  const {
    viewerRef,
    pdfSlickStore: store,
    PDFSlickViewer,
  } = usePdfViewer({ url: props.url });

  return (
    <div class="pdfSlick relative w-full h-full">
      <PDFSlickViewer {...{ store, viewerRef }} />
    </div>
  );
};
