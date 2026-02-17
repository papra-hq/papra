import type { Component } from 'solid-js';
import type { PDFSlickState } from '../pdf-viewer.types';
import { For } from 'solid-js';

type AttachmentsPanelProps = {
  store: PDFSlickState;
};

export const AttachmentsPanel: Component<AttachmentsPanelProps> = (props) => {
  return (
    <div class="p-2 text-sm">
      <For each={Array.from(props.store.attachments.values())}>
        {({ filename, content }) => (
          <button
            type="button"
            class="w-full box-border rounded-sm text-left p-2 hover:bg-accent hover:text-accent-foreground text-foreground transition-colors flex items-center gap-2"
            onClick={() => props.store.pdfSlick?.openOrDownloadData(content, filename)}
          >
            <div class="i-tabler-file-download size-4 shrink-0 text-muted-foreground" />
            <span class="truncate">{filename}</span>
          </button>
        )}
      </For>
    </div>
  );
};
