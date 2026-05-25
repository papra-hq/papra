import { usePDFSlick } from '@pdfslick/solid';
import '@pdfslick/solid/dist/pdf_viewer.css';

export function usePdfViewer({ url }: { url: string }) {
  return usePDFSlick(url, {
    // These assets are required to render PDFs with non-embedded standard system fonts
    // those assets are automatically copied from the pdfjs-dist package
    // see https://github.com/papra-hq/papra/pull/996
    getDocumentParams: {
      cMapUrl: `/pdfjs-assets/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `/pdfjs-assets/standard_fonts/`,
    },
  });
}
