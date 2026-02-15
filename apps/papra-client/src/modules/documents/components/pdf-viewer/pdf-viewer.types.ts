import type { PDFSlickState } from '@pdfslick/solid';
import type { Accessor, Setter } from 'solid-js';

export type { PDFSlickState };

export type PdfViewerStoreProps = {
  store: PDFSlickState;
};

export type ThumbnailsBarTab = 'thumbnails' | 'outline' | 'attachments';

export type ThumbnailsBarProps = PdfViewerStoreProps & {
  thumbsRef: (instance: HTMLElement) => void;
};

export type ToolbarProps = PdfViewerStoreProps & {
  isSidebarOpen: Accessor<boolean>;
  setIsSidebarOpen: Setter<boolean>;
};
