import type { Component } from 'solid-js';
import { usePDFSlick } from '@pdfslick/solid';

import '@pdfslick/solid/dist/pdf_viewer.css';

export const PdfViewer: Component<{ url: string }> = (props) => {
  const {
    viewerRef,
    pdfSlickStore: store,
    PDFSlickViewer,
  } = usePDFSlick(props.url);

  return (
    <div class="pdfSlick relative w-full h-full">
      <PDFSlickViewer {...{ store, viewerRef }} />
    </div>
  );
};
