import type { Component } from 'solid-js';
import type { PdfViewerStoreProps } from '../pdf-viewer.types';
import { ScrollMode, SpreadMode } from '@pdfslick/solid';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/modules/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { DocumentPropertiesDialog } from './document-properties-dialog.component';

export const MoreActionsMenu: Component<PdfViewerStoreProps> = (props) => {
  const [showDocInfo, setShowDocInfo] = createSignal(false);
  const { t } = useI18n();

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            as={(triggerProps: Record<string, unknown>) => (
              <DropdownMenuTrigger
                as={(menuTriggerProps: Record<string, unknown>) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    {...triggerProps}
                    {...menuTriggerProps}
                  >
                    <div class="i-tabler-dots-vertical size-4" />
                  </Button>
                )}
              />
            )}
          />
          <TooltipContent>{t('documents.pdf-viewer.more-actions.label')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent class="min-w-48">
          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.requestPresentationMode()}>
            <div class="i-tabler-presentation size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.presentation-mode')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* File operations (shown here for small screens too) */}
          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.downloadOrSave()}>
            <div class="i-tabler-download size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.download')}</span>
          </DropdownMenuItem>

          <Show when={props.store.pdfSlick?.supportsPrinting}>
            <DropdownMenuItem onSelect={() => props.store.pdfSlick?.triggerPrinting()}>
              <div class="i-tabler-printer size-4 mr-2" />
              <span>{t('documents.pdf-viewer.more-actions.print')}</span>
            </DropdownMenuItem>
          </Show>

          <DropdownMenuSeparator />

          {/* Page navigation */}
          <DropdownMenuItem
            disabled={props.store.pageNumber === 1}
            onSelect={() => props.store.pdfSlick?.gotoPage(1)}
          >
            <div class="i-tabler-arrow-bar-to-up size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.go-to-first-page')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={props.store.pageNumber === props.store.numPages}
            onSelect={() => props.store.pdfSlick?.gotoPage(props.store.numPages)}
          >
            <div class="i-tabler-arrow-bar-to-down size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.go-to-last-page')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Rotation */}
          <DropdownMenuItem
            closeOnSelect={false}
            onSelect={() => props.store.pdfSlick?.setRotation(props.store.pagesRotation + 90)}
          >
            <div class="i-tabler-rotate-clockwise size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.rotate-clockwise')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            closeOnSelect={false}
            onSelect={() => props.store.pdfSlick?.setRotation(props.store.pagesRotation - 90)}
          >
            <div class="i-tabler-rotate size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.rotate-counterclockwise')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Scroll modes */}
          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setScrollMode(ScrollMode.PAGE)}>
            <div class="i-tabler-file size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.page-scrolling')}</span>
            <Show when={props.store.scrollMode === ScrollMode.PAGE}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setScrollMode(ScrollMode.VERTICAL)}>
            <div class="i-tabler-arrows-vertical size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.vertical-scrolling')}</span>
            <Show when={props.store.scrollMode === ScrollMode.VERTICAL}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setScrollMode(ScrollMode.HORIZONTAL)}>
            <div class="i-tabler-arrows-horizontal size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.horizontal-scrolling')}</span>
            <Show when={props.store.scrollMode === ScrollMode.HORIZONTAL}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setScrollMode(ScrollMode.WRAPPED)}>
            <div class="i-tabler-layout-grid size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.wrapped-scrolling')}</span>
            <Show when={props.store.scrollMode === ScrollMode.WRAPPED}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Spread modes */}
          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setSpreadMode(SpreadMode.NONE)}>
            <div class="i-tabler-file size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.no-spreads')}</span>
            <Show when={props.store.spreadMode === SpreadMode.NONE}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setSpreadMode(SpreadMode.ODD)}>
            <div class="i-tabler-columns-2 size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.odd-spreads')}</span>
            <Show when={props.store.spreadMode === SpreadMode.ODD}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => props.store.pdfSlick?.setSpreadMode(SpreadMode.EVEN)}>
            <div class="i-tabler-columns-3 size-4 mr-2" />
            <span class="flex-1">{t('documents.pdf-viewer.more-actions.even-spreads')}</span>
            <Show when={props.store.spreadMode === SpreadMode.EVEN}>
              <div class="i-tabler-check size-4 ml-2 text-primary" />
            </Show>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Document properties */}
          <DropdownMenuItem onSelect={() => setShowDocInfo(true)}>
            <div class="i-tabler-info-circle size-4 mr-2" />
            <span>{t('documents.pdf-viewer.more-actions.document-properties')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentPropertiesDialog
        store={props.store}
        isOpen={showDocInfo()}
        onClose={() => setShowDocInfo(false)}
      />
    </>
  );
};
