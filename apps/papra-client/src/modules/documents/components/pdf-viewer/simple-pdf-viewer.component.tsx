import type { Component } from 'solid-js';
import { usePDFSlick } from '@pdfslick/solid';

import '@pdfslick/solid/dist/pdf_viewer.css';

export const SimplePdfViewer: Component<{ url: string }> = (props) => {
  const {
    viewerRef,
    pdfSlickStore: store,
    PDFSlickViewer,
  } = usePDFSlick(props.url, {
    getDocumentParams: {
      cMapUrl: `https://unpkg.com/pdfjs-dist@${__PDFJS_VERSION__}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${__PDFJS_VERSION__}/standard_fonts/`,
    },
  });

  return (
    <div class="pdfSlick relative w-full h-full">
      <PDFSlickViewer {...{ store, viewerRef }} />
    </div>
  );
};
