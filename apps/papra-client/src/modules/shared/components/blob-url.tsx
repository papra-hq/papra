import type { Component, JSX } from 'solid-js';
import { onCleanup, Show } from 'solid-js';

export const BlobUrl: Component<{
  blob: Blob | undefined;
  children: (url: string) => JSX.Element;
}> = (props) => (
  <Show when={props.blob} keyed>
    {(blob) => {
      const url = URL.createObjectURL(blob);

      onCleanup(() => {
        // Let synchronous consumer cleanup finish before releasing the URL.
        queueMicrotask(() => URL.revokeObjectURL(url));
      });

      return props.children(url);
    }}
  </Show>
);
