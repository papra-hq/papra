import type { Component } from 'solid-js';
import { usePDFSlick } from '@pdfslick/solid';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { SideBar } from './sidebar/sidebar.component';
import { PdfViewerToolbar } from './toolbar/pdf-viewer-toolbar.component';
import '@pdfslick/solid/dist/pdf_viewer.css';

const SIDEBAR_DEFAULT_WIDTH = 233;
const SIDEBAR_MIN_WIDTH = 195;
const SIDEBAR_MAX_WIDTH = 600;

export const PdfViewer: Component<{ url: string }> = (props) => {
  const {
    viewerRef,
    thumbsRef,
    pdfSlickStore: store,
    PDFSlickViewer,
  } = usePDFSlick(props.url);

  const [isSidebarOpen, setIsSidebarOpen] = createSignal(true);
  const [sidebarWidth, setSidebarWidth] = createSignal(SIDEBAR_DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = createSignal(false);

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;

        if (width < 480 && isSidebarOpen()) {
          setIsSidebarOpen(false);
        } else if (width >= 520 && !isSidebarOpen()) {
          setIsSidebarOpen(true);
        }
      }
    });

    observer.observe(document.body);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }

    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      store.pdfSlick?.viewer?.increaseScale();
    } else if (e.key === '-') {
      e.preventDefault();
      store.pdfSlick?.viewer?.decreaseScale();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }

    e.preventDefault();

    if (e.deltaY < 0) {
      store.pdfSlick?.viewer?.increaseScale();
    } else if (e.deltaY > 0) {
      store.pdfSlick?.viewer?.decreaseScale();
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
  });
  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('wheel', handleWheel);
  });

  const onResizeHandlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth();
    setIsDragging(true);

    const onPointerMove = (e: PointerEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div class="pdfSlick relative w-full h-full flex flex-col">
      <PdfViewerToolbar
        store={store}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div class="flex-1 flex overflow-hidden min-h-0">
        <div
          class={cn('shrink-0 h-full overflow-hidden', { 'transition-width duration-200': !isDragging() })}
          style={{ width: isSidebarOpen() ? `${sidebarWidth()}px` : '0px' }}
        >
          <SideBar
            store={store}
            thumbsRef={thumbsRef}
          />
        </div>

        <div
          class="w-3 ml--1.5 shrink-0 cursor-col-resize"
          style={{ display: isSidebarOpen() ? undefined : 'none' }}
          onPointerDown={onResizeHandlePointerDown}
        />

        <div class="flex-1 relative h-full min-w-0">
          <PDFSlickViewer {...{ store, viewerRef }} />
        </div>
      </div>
    </div>
  );
};
