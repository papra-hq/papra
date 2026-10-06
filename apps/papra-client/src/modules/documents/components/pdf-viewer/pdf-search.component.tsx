import type { PDFSlick } from '@pdfslick/solid';
import type { Accessor, Component } from 'solid-js';
import { createEffect, Match, on, onCleanup, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createPdfSearch } from './pdf-search';

export const PdfSearch: Component<{
  id: string;
  pdfSlick: PDFSlick;
  isOpen: Accessor<boolean>;
  onClose: () => void;
  inputRef: (input: HTMLInputElement) => void;
}> = (props) => {
  const { t } = useI18n();
  const search = createPdfSearch({ eventBus: props.pdfSlick.eventBus });

  createEffect(
    on(props.isOpen, (isOpen, wasOpen) => {
      if (isOpen) {
        search.open();
      } else if (wasOpen) {
        search.close();
      }
    }),
  );

  onCleanup(search.dispose);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      if (event.shiftKey) {
        search.previous();
      } else {
        search.next();
      }
    }
  };

  const cannotNavigate = () => !search.query() || search.status() === 'not-found';

  return (
    <div
      id={props.id}
      role="search"
      aria-label={t('documents.pdf-viewer.search.label')}
      class={cn(
        'absolute top-2 right-2 z-20 w-96 rounded-lg border bg-popover text-popover-foreground p-2 shadow-md',
        {
          hidden: !props.isOpen(),
        },
      )}
      style={{ 'max-width': 'calc(100% - 1rem)' }}
    >
      <div class="flex items-center gap-1">
        <TextFieldRoot value={search.query()} onChange={search.setQuery} class="flex-1 min-w-0">
          <TextField
            ref={props.inputRef}
            aria-label={t('documents.pdf-viewer.search.label')}
            placeholder={t('documents.pdf-viewer.search.placeholder')}
            class="h-8 px-2"
            onKeyDown={handleKeyDown}
          />
        </TextFieldRoot>

        <Button
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          aria-label={t('documents.pdf-viewer.search.previous')}
          title={t('documents.pdf-viewer.search.previous')}
          disabled={cannotNavigate()}
          onClick={search.previous}
        >
          <div class="i-tabler-chevron-up size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          aria-label={t('documents.pdf-viewer.search.next')}
          title={t('documents.pdf-viewer.search.next')}
          disabled={cannotNavigate()}
          onClick={search.next}
        >
          <div class="i-tabler-chevron-down size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          aria-label={t('documents.pdf-viewer.search.close')}
          title={t('documents.pdf-viewer.search.close')}
          onClick={props.onClose}
        >
          <div class="i-tabler-x size-4" />
        </Button>
      </div>

      <div role="status" aria-live="polite" class="min-h-4 mt-1 text-xs text-muted-foreground">
        <Switch>
          <Match when={search.status() === 'pending'}>
            {t('documents.pdf-viewer.search.searching')}
          </Match>
          <Match when={search.status() === 'not-found'}>
            {t('documents.pdf-viewer.search.no-matches')}
          </Match>
          <Match when={search.query() && search.matchesCount().total > 0}>
            {t('documents.pdf-viewer.search.matches', search.matchesCount())}
          </Match>
        </Switch>
      </div>

      <div class="flex flex-wrap gap-x-3 gap-y-2 mt-2">
        <Checkbox
          class="flex items-center gap-1.5"
          checked={search.options().caseSensitive}
          onChange={(value) => search.setOption('caseSensitive', value)}
        >
          <CheckboxControl />
          <CheckboxLabel class="text-xs">
            {t('documents.pdf-viewer.search.match-case')}
          </CheckboxLabel>
        </Checkbox>
        <Checkbox
          class="flex items-center gap-1.5"
          checked={search.options().entireWord}
          onChange={(value) => search.setOption('entireWord', value)}
        >
          <CheckboxControl />
          <CheckboxLabel class="text-xs">
            {t('documents.pdf-viewer.search.whole-words')}
          </CheckboxLabel>
        </Checkbox>
        <Checkbox
          class="flex items-center gap-1.5"
          checked={search.options().highlightAll}
          onChange={(value) => search.setOption('highlightAll', value)}
        >
          <CheckboxControl />
          <CheckboxLabel class="text-xs">
            {t('documents.pdf-viewer.search.highlight-all')}
          </CheckboxLabel>
        </Checkbox>
      </div>
    </div>
  );
};
