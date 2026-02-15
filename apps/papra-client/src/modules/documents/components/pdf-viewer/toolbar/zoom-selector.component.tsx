import type { Component } from 'solid-js';
import type { PdfViewerStoreProps } from '../pdf-viewer.types';
import { For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';

const zoomValues = new Map([
  [0.5, '50%'],
  [0.75, '75%'],
  [1, '100%'],
  [1.25, '125%'],
  [1.5, '150%'],
  [2, '200%'],
  [3, '300%'],
]);

export const ZoomSelector: Component<PdfViewerStoreProps> = (props) => {
  const { t } = useI18n();

  const scalePresets = new Map([
    ['auto', t('documents.pdf-viewer.zoom.auto')],
    ['page-actual', t('documents.pdf-viewer.zoom.actual-size')],
    ['page-fit', t('documents.pdf-viewer.zoom.page-fit')],
    ['page-width', t('documents.pdf-viewer.zoom.page-width')],
  ]);

  const getDisplayValue = () => {
    if (props.store.scaleValue && scalePresets.has(props.store.scaleValue)) {
      return scalePresets.get(props.store.scaleValue);
    }
    return `${Math.round(props.store.scale * 100)}%`;
  };

  return (
    <div class="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              {...triggerProps}
              variant="ghost"
              size="icon"
              class="size-8"
              disabled={!props.store.pdfSlick || props.store.scale <= 0.25}
              onClick={() => props.store.pdfSlick?.viewer?.decreaseScale()}
            >
              <div class="i-tabler-minus size-4" />
            </Button>
          )}
        />
        <TooltipContent>{t('documents.pdf-viewer.zoom.zoom-out')}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              variant="outline"
              size="sm"
              class="min-w-22 justify-between gap-1 font-normal"
              {...triggerProps}
            >
              <span class="tabular-nums">{getDisplayValue()}</span>
              <div class="i-tabler-chevron-down size-3 opacity-50" />
            </Button>
          )}
        />
        <DropdownMenuContent class="min-w-36">
          <For each={Array.from(scalePresets.entries())}>
            {([value, label]) => (
              <DropdownMenuItem onSelect={() => {
                props.store.pdfSlick!.currentScaleValue = value;
              }}
              >
                <span>{label}</span>
              </DropdownMenuItem>
            )}
          </For>
          <DropdownMenuSeparator />
          <For each={Array.from(zoomValues.entries())}>
            {([value, label]) => (
              <DropdownMenuItem onSelect={() => {
                props.store.pdfSlick!.currentScale = value;
              }}
              >
                <span>{label}</span>
              </DropdownMenuItem>
            )}
          </For>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              {...triggerProps}
              variant="ghost"
              size="icon"
              class="size-8"
              disabled={!props.store.pdfSlick || props.store.scale >= 5}
              onClick={() => props.store.pdfSlick?.viewer?.increaseScale()}
            >
              <div class="i-tabler-plus size-4" />
            </Button>
          )}
        />
        <TooltipContent>{t('documents.pdf-viewer.zoom.zoom-in')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
