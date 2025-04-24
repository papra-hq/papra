import type { Component } from 'solid-js';
import { Button } from '@/modules/ui/components/button';
import { makePersisted } from '@solid-primitives/storage';
import { createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';

export const DevToolsOverlayComponent: Component = () => {
  const [isCollapsed, setIsCollapsed] = makePersisted(createSignal<boolean>(true), { name: 'papra-dev-tools-collapsed', storage: localStorage });

  return (
    <Portal>
      <Show
        when={!isCollapsed()}
        fallback={(
          <Button
            onClick={() => setIsCollapsed(false)}
            variant="secondary"
            class="fixed bottom-0 left-50% -translate-x-1/2 z-50 rounded-b-none shadow"
          >
            <div class="i-tabler-chevron-up size-5" />
          </Button>
        )}
      >
        <div class="fixed bottom-0 left-50% -translate-x-1/2 z-50 bg-card rounded-t-xl shadow w-full max-w-500px border border-b-none">
          <div class="flex items-center justify-between py-2 px-5">
            <span class="text-sm font-medium">
              Dev Tools
            </span>

            <Button
              onClick={() => setIsCollapsed(true)}
              variant="ghost"
              size="icon"
            >
              <div class="i-tabler-chevron-down size-5" />
            </Button>
          </div>

        </div>
      </Show>
    </Portal>
  );
};
