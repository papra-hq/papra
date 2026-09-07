import type { Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/modules/ui/components/popover';
import {
  getDocumentColumnsForPicker,
  getSelectedDocumentColumns,
  moveDocumentColumn,
  toggleDocumentColumn,
} from '../document-columns.models';

export const DocumentColumnsPicker: Component<{
  columns: { id: string; label: string }[];
  selectedColumnIds: string[];
  onSelectedColumnIdsChange: (selectedColumnIds: string[]) => void;
  isLoading: boolean;
  hasError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}> = (props) => {
  const { t } = useI18n();
  const selectedColumns = createMemo(() =>
    getSelectedDocumentColumns({
      columns: props.columns,
      selectedColumnIds: props.selectedColumnIds,
    }),
  );
  const selectedColumnIds = createMemo(() => selectedColumns().map(({ id }) => id));
  const orderedColumns = createMemo(() =>
    getDocumentColumnsForPicker({
      columns: props.columns,
      selectedColumnIds: selectedColumnIds(),
    }),
  );
  const moveColumn = (
    columnId: string,
    direction: 'earlier' | 'later',
    trigger: HTMLButtonElement,
  ) => {
    const previousIds = props.selectedColumnIds;
    const nextIds = moveDocumentColumn({
      selectedColumnIds: previousIds,
      availableColumnIds: selectedColumnIds(),
      columnId,
      direction,
    });

    if (nextIds !== previousIds) {
      props.onSelectedColumnIdsChange(nextIds);
      trigger.focus();
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger
        as={Button}
        variant="outline"
        aria-label={t('documents.list.columns.button')}
        aria-busy={props.isLoading}
        isLoading={props.isLoading}
      >
        <Show when={!props.isLoading}>
          <div class="i-tabler-columns-3 size-4 sm:mr-2" />
        </Show>
        <span class="hidden sm:inline">{t('documents.list.columns.button')}</span>
        <Show when={selectedColumnIds().length > 0}>
          <span class="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
            {selectedColumnIds().length}
          </span>
        </Show>
      </PopoverTrigger>

      <PopoverContent class="w-80 p-0">
        <div class="border-b p-4">
          <PopoverTitle class="font-semibold">{t('documents.list.columns.title')}</PopoverTitle>
          <p class="mt-1 text-xs text-muted-foreground">
            {t('documents.list.columns.description')}
          </p>
        </div>

        <Show when={props.hasError}>
          <div class="border-b p-4 text-sm" role="status">
            <p class="text-muted-foreground">{t('documents.list.columns.load-error')}</p>
            <Button
              variant="link"
              size="sm"
              class="h-auto p-0 mt-2"
              isLoading={props.isRetrying}
              onClick={props.onRetry}
            >
              {t('documents.list.columns.retry')}
            </Button>
          </div>
        </Show>

        <div class="max-h-80 overflow-y-auto p-2">
          <For each={orderedColumns()}>
            {(column) => {
              const selectedIndex = () => selectedColumnIds().indexOf(column.id);
              const isSelected = () => selectedIndex() !== -1;

              return (
                <div class="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent/50">
                  <Checkbox
                    class="flex min-w-0 flex-1 items-center gap-2"
                    checked={isSelected()}
                    onChange={(checked) => {
                      const focusedElement = document.activeElement;
                      props.onSelectedColumnIdsChange(
                        toggleDocumentColumn({
                          selectedColumnIds: props.selectedColumnIds,
                          columnId: column.id,
                          isSelected: checked,
                        }),
                      );
                      // Moving the row can detach its focused checkbox from the DOM.
                      if (focusedElement instanceof HTMLElement) {
                        focusedElement.focus();
                      }
                    }}
                  >
                    <CheckboxControl />
                    <CheckboxLabel class="truncate text-sm" title={column.label}>
                      {column.label}
                    </CheckboxLabel>
                  </Checkbox>

                  <Show when={isSelected()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7 aria-disabled:opacity-50"
                      aria-disabled={selectedIndex() === 0}
                      aria-label={t('documents.list.columns.move-earlier', {
                        name: column.label,
                      })}
                      onClick={(event) => moveColumn(column.id, 'earlier', event.currentTarget)}
                    >
                      <div class="i-tabler-chevron-up size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7 aria-disabled:opacity-50"
                      aria-disabled={selectedIndex() === selectedColumnIds().length - 1}
                      aria-label={t('documents.list.columns.move-later', {
                        name: column.label,
                      })}
                      onClick={(event) => moveColumn(column.id, 'later', event.currentTarget)}
                    >
                      <div class="i-tabler-chevron-down size-4" />
                    </Button>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
};
