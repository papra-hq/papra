import type { Component } from 'solid-js';
import { usePDFSlick } from '@pdfslick/solid';

import '@pdfslick/solid/dist/pdf_viewer.css';

export const SimplePdfViewer: Component<{ url: string }> = (props) => {
  const {
    viewerRef,
    pdfSlickStore: store,
    PDFSlickViewer,
  } = usePDFSlick(props.url, {
    // These assets are required to render PDFs with non-embedded standard
    // system fonts. They are automatically copied from the pdfjs-dist package
    // to the `public/pdfjs-dist/` directory by the `copyPdfjsAssetsPlugin` in
    // `vite.config.ts` during build.
    getDocumentParams: {
      cMapUrl: `/pdfjs-assets/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `/pdfjs-assets/standard_fonts/`,
    },
  });

  return (
    <div class="pdfSlick relative w-full h-full">
      <PDFSlickViewer {...{ store, viewerRef }} />
    </div>
  );
};
