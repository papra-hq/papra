import type { Component } from 'solid-js';
import type { PDFSlickState } from '../pdf-viewer.types';
import { PDFSlickThumbnails } from '@pdfslick/solid';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';

type ThumbnailsPanelProps = {
  store: PDFSlickState;
  thumbsRef: (instance: HTMLElement) => void;
  show: boolean;
};

const PageThumbnail: Component<{
  pageNumber: number;
  pageLabel: string | null;
  src: string | null;
  width: number;
  height: number;
  loaded: boolean;
  onClick?: () => void;
  currentPage: number;
  altText: string;
}> = (props) => {
  const isCurrentPageSelected = () => props.pageNumber === props.currentPage;

  return (
    <button
      type="button"
      onClick={props.onClick}
      class={cn('p-2 rounded-xl transition-colors hover:bg-accent mx-auto block', { 'bg-muted': isCurrentPageSelected() })}
    >
      {props.src && (
        <img
          src={props.src}
          width={props.width}
          height={props.height}
          alt={props.altText}
          class="block rounded"
        />
      )}

      <div
        class={cn('text-center text-xs pt-2 transition-colors text-muted-foreground', { 'text-foreground font-medium': isCurrentPageSelected() })}
      >
        {props.pageLabel ?? props.pageNumber}
      </div>
    </button>
  );
};

export const ThumbnailsPanel: Component<ThumbnailsPanelProps> = (props) => {
  const { t } = useI18n();
  let containerRef!: HTMLDivElement;
  const [containerWidth, setContainerWidth] = createSignal(200);

  const cols = () => Math.max(1, Math.round(containerWidth() / 180));

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <div
      class={cn('px-2 relative h-full', { invisible: !props.show })}
      ref={containerRef}
    >
      <PDFSlickThumbnails
        thumbsRef={props.thumbsRef}
        store={props.store}
        class={cn(
          'grid gap-1 mx-auto py-4 content-start',
          {
            'grid-cols-1': cols() <= 1,
            'grid-cols-2': cols() === 2,
            'grid-cols-3': cols() === 3,
            'grid-cols-4': cols() > 3,
          },
        )}
      >
        {({ pageNumber, width, height, src, pageLabel, loaded }) => (
          <PageThumbnail
            pageNumber={pageNumber}
            width={width}
            height={height}
            src={src}
            pageLabel={pageLabel}
            loaded={loaded}
            currentPage={props.store.pageNumber}
            onClick={() => props.store.pdfSlick?.gotoPage(pageNumber)}
            altText={t('documents.pdf-viewer.thumbnails.page-alt', { page: pageLabel ?? pageNumber })}
          />
        )}
      </PDFSlickThumbnails>
    </div>
  );
};
