import type { PDFSlickState, TPDFDocumentOutline } from '@pdfslick/solid';
import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';

type OutlinePanelProps = {
  store: PDFSlickState;
};

const OutlineItem: Component<{ title: string; dest: any; items?: TPDFDocumentOutline; store: PDFSlickState; level: number }> = (props) => {
  const [getIsExpanded, setIsExpanded] = createSignal(false);
  const hasChildren = () => props.items && props.items.length > 0;

  return (
    <li class="relative p-1 py-px">
      <div class="flex items-start">
        {hasChildren()
          ? (
              <Button
                variant="ghost"
                size="icon"
                class="size-6 text-muted-foreground"
                onClick={() => setIsExpanded(prev => !prev)}
              >
                <div class={cn('i-tabler-chevron-right size-3.5 transition-transform', { 'rotate-90': getIsExpanded() })} />
              </Button>
            )
          : <span class="block w-6" />}
        <button
          type="button"
          class="flex-1 rounded-sm text-left text-xs px-1 py-0.5 hover:bg-accent hover:text-accent-foreground text-sm transition-colors truncate"
          onClick={() => props.store.pdfSlick?.linkService?.goToDestination(props.dest)}
        >
          {props.title}
        </button>
      </div>
      <Show when={hasChildren() && getIsExpanded()}>
        <div class="ml-3 border-l">
          {/* eslint-disable-next-line ts/no-use-before-define */}
          <OutlineItems
            outline={props.items ?? []}
            store={props.store}
            level={props.level + 1}
          />
        </div>
      </Show>
    </li>
  );
};

const OutlineItems: Component<{
  outline: TPDFDocumentOutline | null;
  store: PDFSlickState;
  level?: number;
}> = (props) => {
  const getItems = () => props.outline ?? [];
  return (
    <ul class="w-full">
      <For each={getItems()}>
        {item => (
          <OutlineItem
            {...item}
            store={props.store}
            level={props.level ?? 0}
          />
        )}
      </For>
    </ul>
  );
};

export const OutlinePanel: Component<OutlinePanelProps> = (props) => {
  return (
    <div class="pt-2 text-foreground text-sm">
      <OutlineItems
        outline={props.store.documentOutline}
        store={props.store}
      />
    </div>
  );
};
