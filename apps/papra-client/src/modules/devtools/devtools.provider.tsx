import type { ParentComponent } from 'solid-js';
import { createSignal, createUniqueId, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/ui/components/tabs';
import { DevtoolsContext } from './devtools.context';
import { createDevtoolsRegistry } from './devtools.models';
import { DemoModeDevtool } from './tools/demo-mode/demo-mode.devtool';

export { useDevtools } from './devtools.context';

export const DevtoolsProvider: ParentComponent = (props) => {
  const registry = createDevtoolsRegistry();
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getSelectedToolId, setSelectedToolId] = createSignal<string>();
  const panelId = createUniqueId();
  const titleId = createUniqueId();

  // oxlint-disable-next-line no-unassigned-vars -- assigned via Solid ref binding in JSX
  let panelRef: HTMLElement | undefined;
  // oxlint-disable-next-line no-unassigned-vars -- assigned via Solid ref binding in JSX
  let triggerRef: HTMLButtonElement | undefined;

  const getActiveToolId = () => {
    const tools = registry.getTools();
    return tools.find(({ id }) => id === getSelectedToolId())?.id ?? tools[0]?.id;
  };

  const closeDevtools = () => {
    setIsOpen(false);
    triggerRef?.focus();
  };

  const openDevtools = () => {
    setIsOpen(true);
    panelRef?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
  };

  return (
    <DevtoolsContext.Provider value={{ ...registry, closeDevtools }}>
      <DemoModeDevtool />
      {props.children}

      <Portal>
        <div class="pointer-events-none fixed inset-x-2 bottom-2 z-40 mx-auto max-w-4xl font-sans text-sm text-foreground sm:inset-x-4 sm:bottom-4">
          <div hidden={getIsOpen()} class="text-center">
            <Button
              ref={triggerRef}
              variant="outline"
              size="sm"
              class="pointer-events-auto cursor-pointer gap-2 rounded-full bg-background shadow-lg px-4"
              aria-controls={panelId}
              aria-expanded={getIsOpen()}
              onClick={openDevtools}
            >
              <span class="i-tabler-code size-4 text-primary" aria-hidden="true" />
              Devtools
            </Button>
          </div>

          <section
            ref={panelRef}
            id={panelId}
            aria-labelledby={titleId}
            hidden={!getIsOpen()}
            class="pointer-events-auto overflow-hidden rounded-2xl border bg-background shadow-2xl"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !event.defaultPrevented) {
                event.preventDefault();
                event.stopPropagation();
                closeDevtools();
              }
            }}
          >
            <header class="border-b">
              <h2>
                <button
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 focus-visible:(outline-none ring-1.5 ring-inset ring-ring)"
                  aria-label="Minimize devtools"
                  aria-expanded={getIsOpen()}
                  title="Minimize (Esc)"
                  onClick={closeDevtools}
                >
                  <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span class="i-tabler-code size-5" aria-hidden="true" />
                  </span>
                  <span id={titleId} class="font-semibold">
                    Papra devtools
                  </span>
                  <span class="ml-auto flex size-9 items-center justify-center" aria-hidden="true">
                    <span class="i-tabler-chevron-down size-5" />
                  </span>
                </button>
              </h2>
            </header>

            <Show
              when={registry.getTools().length > 0}
              fallback={<p class="p-6 text-muted-foreground">No tools registered on this page.</p>}
            >
              <Tabs
                orientation="vertical"
                value={getActiveToolId()}
                onChange={setSelectedToolId}
                class="h-80 max-h-[60dvh] min-h-0"
              >
                <TabsList
                  aria-label="Developer tools"
                  class="w-32 sm:w-48 shrink-0 gap-1 overflow-y-auto rounded-none border-r bg-muted/30 p-2"
                >
                  <For each={registry.getTools()}>
                    {(tool) => (
                      <TabsTrigger
                        value={tool.id}
                        class="cursor-pointer h-auto min-h-10 justify-start gap-2 whitespace-normal px-2 sm:px-3 py-2 text-left data-[selected]:(bg-primary/10 text-primary) focus-visible:(ring-1.5 ring-ring)"
                      >
                        <span
                          class={cn(tool.icon, 'hidden sm:block size-4 shrink-0')}
                          aria-hidden="true"
                        />
                        {tool.title}
                      </TabsTrigger>
                    )}
                  </For>
                </TabsList>
                <div class="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  <For each={registry.getTools()}>
                    {(tool) => (
                      <TabsContent
                        value={tool.id}
                        forceMount
                        hidden={getActiveToolId() !== tool.id}
                        class="data-[orientation=vertical]:ml-0"
                      >
                        <tool.component />
                      </TabsContent>
                    )}
                  </For>
                </div>
              </Tabs>
            </Show>
          </section>
        </div>
      </Portal>
    </DevtoolsContext.Provider>
  );
};
