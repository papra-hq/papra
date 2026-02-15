import type { TEventBusEvent } from '@pdfslick/solid';
import type { Component } from 'solid-js';
import type { ToolbarProps } from '../pdf-viewer.types';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { MoreActionsMenu } from './more-actions-menu.component';
import { ZoomSelector } from './zoom-selector.component';

export const PdfViewerToolbar: Component<ToolbarProps> = (props) => {
  let pageNumberRef!: HTMLInputElement;
  const { t } = useI18n();

  const [pageInputValue, setPageInputValue] = createSignal<string>('1');

  const updatePageNumber = (event: TEventBusEvent | object) => {
    if ('pageNumber' in event) {
      setPageInputValue(String(event.pageNumber));
    }
  };

  createEffect(() => {
    const pdfSlick = props.store.pdfSlick;
    if (pdfSlick) {
      pdfSlick.on('pagechanging', updatePageNumber);
    }
  });

  onCleanup(() => {
    props.store.pdfSlick?.off('pagechanging', updatePageNumber);
  });

  const handlePageSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const newPageNumber = Number.parseInt(pageInputValue(), 10);
    if (Number.isInteger(newPageNumber) && newPageNumber > 0 && newPageNumber <= props.store.numPages) {
      props.store.pdfSlick?.linkService.goToPage(newPageNumber);
    } else {
      setPageInputValue(String(props.store.pageNumber));
    }
  };

  const handlePageKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        props.store.pdfSlick?.gotoPage(Math.min(props.store.numPages, props.store.pageNumber + 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        props.store.pdfSlick?.gotoPage(Math.max(1, props.store.pageNumber - 1));
        break;
    }
  };

  return (
    <div class="flex items-center justify-between px-1 py-1 border-b bg-card text-card-foreground shrink-0 select-none">
      <div class="flex items-center">
        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                class="size-8"
                onClick={() => props.setIsSidebarOpen(prev => !prev)}
              >
                <Show
                  when={props.isSidebarOpen()}
                  fallback={<div class="i-tabler-layout-sidebar-left-collapse size-4" />}
                >
                  <div class="i-tabler-layout-sidebar-left-expand size-4" />
                </Show>
              </Button>
            )}
          />
          <TooltipContent>
            {props.isSidebarOpen() ? t('documents.pdf-viewer.toolbar.hide-sidebar') : t('documents.pdf-viewer.toolbar.show-sidebar')}
          </TooltipContent>
        </Tooltip>

        <div class="mx-1 h-5 w-1px bg-border" />

        <div class="hidden sm:flex items-center">
          <ZoomSelector store={props.store} />
        </div>

        <div class="mx-0.5 h-5 w-px bg-border hidden sm:block" />

        <div class="flex items-center">
          <Tooltip>
            <TooltipTrigger
              as={(triggerProps: Record<string, unknown>) => (
                <Button
                  {...triggerProps}
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  disabled={props.store.pageNumber <= 1}
                  onClick={() => props.store.pdfSlick?.viewer?.previousPage()}
                >
                  <div class="i-tabler-chevron-up size-4" />
                </Button>
              )}
            />
            <TooltipContent>{t('documents.pdf-viewer.toolbar.previous-page')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              as={(triggerProps: Record<string, unknown>) => (
                <Button
                  {...triggerProps}
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  disabled={!props.store.pdfSlick || props.store.pageNumber >= props.store.numPages}
                  onClick={() => props.store.pdfSlick?.viewer?.nextPage()}
                >
                  <div class="i-tabler-chevron-down size-4" />
                </Button>
              )}
            />
            <TooltipContent>{t('documents.pdf-viewer.toolbar.next-page')}</TooltipContent>
          </Tooltip>

          <div class="flex items-center gap-1.5 text-xs">
            <form onSubmit={handlePageSubmit} class="contents">
              <input
                ref={pageNumberRef}
                type="text"
                inputMode="numeric"
                value={pageInputValue()}
                class="w-10 text-center rounded-md border border-input bg-background px-1 h-32px text-xs outline-none focus:(ring-1.5 ring-ring)"
                onFocus={() => pageNumberRef.select()}
                onInput={e => setPageInputValue(e.currentTarget.value)}
                onKeyDown={handlePageKeyDown}
              />
            </form>
            <span class="text-muted-foreground whitespace-nowrap">
              /
              {' '}
              {props.store.numPages}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center">
        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                class="size-8 hidden md:inline-flex"
                onClick={() => {
                  if (props.store.pdfSlick) {
                    props.store.pdfSlick.currentScaleValue = 'page-width';
                  }
                }}
              >
                <div class="i-tabler-arrows-horizontal size-4" />
              </Button>
            )}
          />
          <TooltipContent>{t('documents.pdf-viewer.toolbar.fit-width')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                class="size-8 hidden md:inline-flex"
                onClick={() => {
                  if (props.store.pdfSlick) {
                    props.store.pdfSlick.currentScaleValue = 'page-fit';
                  }
                }}
              >
                <div class="i-tabler-arrows-maximize size-4" />
              </Button>
            )}
          />
          <TooltipContent>{t('documents.pdf-viewer.toolbar.fit-page')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                class="size-8 hidden md:inline-flex"
                onClick={() => props.store.pdfSlick?.setRotation(props.store.pagesRotation + 90)}
              >
                <div class="i-tabler-rotate-clockwise size-4" />
              </Button>
            )}
          />
          <TooltipContent>{t('documents.pdf-viewer.toolbar.rotate-clockwise')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                class="size-8 hidden sm:inline-flex"
                onClick={() => props.store.pdfSlick?.downloadOrSave()}
              >
                <div class="i-tabler-download size-4" />
              </Button>
            )}
          />
          <TooltipContent>{t('documents.pdf-viewer.toolbar.download')}</TooltipContent>
        </Tooltip>

        <Show when={props.store.pdfSlick?.supportsPrinting}>
          <Tooltip>
            <TooltipTrigger
              as={(triggerProps: Record<string, unknown>) => (
                <Button
                  {...triggerProps}
                  variant="ghost"
                  size="icon"
                  class="size-8 hidden sm:inline-flex"
                  onClick={() => props.store.pdfSlick?.triggerPrinting()}
                >
                  <div class="i-tabler-printer size-4" />
                </Button>
              )}
            />
            <TooltipContent>{t('documents.pdf-viewer.toolbar.print')}</TooltipContent>
          </Tooltip>
        </Show>

        <MoreActionsMenu store={props.store} />
      </div>
    </div>
  );
};
