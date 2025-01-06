import type { Accessor, ParentComponent } from 'solid-js';
import type { Document } from '../documents/documents.types';
import { useNavigate, useParams } from '@solidjs/router';
import { debounce } from 'lodash-es';
import { createContext, createEffect, createSignal, For, on, onCleanup, onMount, Show, useContext } from 'solid-js';
import { getDocumentIcon } from '../documents/document.models';
import { searchDocuments } from '../documents/documents.services';
import { cn } from '../shared/style/cn';
import { useThemeStore } from '../theme/theme.store';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading } from '../ui/components/command';

const CommandPaletteContext = createContext<{
  getIsCommandPaletteOpen: Accessor<boolean>;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}>();

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error('CommandPalette context not found');
  }

  return context;
}

export const CommandPaletteProvider: ParentComponent = (props) => {
  const [getIsCommandPaletteOpen, setIsCommandPaletteOpen] = createSignal(false);
  const [getMatchingDocuments, setMatchingDocuments] = createSignal<Document[]>([]);
  const [getSearchQuery, setSearchQuery] = createSignal('');
  const params = useParams();
  const [getIsLoading, setIsLoading] = createSignal(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  const navigate = useNavigate();
  const { setColorMode } = useThemeStore();

  const searchDocs = debounce(async ({ searchQuery }: { searchQuery: string }) => {
    const { documents } = await searchDocuments({ searchQuery, organizationId: params.organizationId, pageIndex: 0, pageSize: 5 });
    setMatchingDocuments(documents);
    setIsLoading(false);
  }, 300);

  createEffect(on(
    getSearchQuery,
    (searchQuery) => {
      setMatchingDocuments([]);
      if (searchQuery.length > 1) {
        setIsLoading(true);
        searchDocs({ searchQuery });
      }
    },
  ));

  createEffect(on(
    getIsCommandPaletteOpen,
    (isCommandPaletteOpen) => {
      if (isCommandPaletteOpen) {
        setMatchingDocuments([]);
      }
    },
  ));

  const getCommandData = (): {
    label: string;
    forceMatch?: boolean;
    options: { label: string; icon: string; action: () => void; forceMatch?: boolean }[];
  }[] => [
    {
      label: 'Documents',
      forceMatch: true,
      options: getMatchingDocuments().map(document => ({
        label: document.name,
        icon: getDocumentIcon({ document }),
        action: () => navigate(`/organizations/${params.organizationId}/documents/${document.id}`),
        forceMatch: true,
      })),
    },
    {
      label: `Theme`,
      options: [
        {
          label: 'Switch to light mode',
          icon: 'i-tabler-sun',
          action: () => setColorMode({ mode: 'light' }),
        },
        {
          label: 'Switch to dark mode',
          icon: 'i-tabler-moon',
          action: () => setColorMode({ mode: 'dark' }),
        },
        {
          label: 'Switch to system',
          icon: 'i-tabler-device-laptop',
          action: () => setColorMode({ mode: 'system' }),
        },
      ],
    },
  ];

  const onCommandSelect = ({ action }: { action: () => void }) => {
    action();
    setIsCommandPaletteOpen(false);
  };

  return (
    <CommandPaletteContext.Provider value={{
      getIsCommandPaletteOpen,
      openCommandPalette: () => setIsCommandPaletteOpen(true),
      closeCommandPalette: () => setIsCommandPaletteOpen(false),
    }}
    >

      <CommandDialog
        class="rounded-lg border shadow-md"
        open={getIsCommandPaletteOpen()}
        onOpenChange={setIsCommandPaletteOpen}
      >

        <CommandInput placeholder="Search commands" onValueChange={setSearchQuery} />
        <CommandList>
          <Show when={getIsLoading()}>
            <CommandLoading>
              <div class="i-tabler-loader-2 size-6 animate-spin text-muted-foreground mx-auto"></div>
            </CommandLoading>
          </Show>
          <Show when={!getIsLoading()}>
            <Show when={getMatchingDocuments().length === 0}>
              <CommandEmpty>
                No results found.
              </CommandEmpty>
            </Show>

            <For each={getCommandData().filter(section => section.options.length > 0)}>
              {section => (
                <CommandGroup heading={section.label} forceMount={section.forceMatch ?? false}>
                  <For each={section.options}>
                    {item => (
                      <CommandItem onSelect={() => onCommandSelect(item)} forceMount={item.forceMatch ?? false}>
                        <span class={cn('mr-2 ml-2 size-4 text-primary', item.icon)} />
                        <span>{item.label}</span>
                      </CommandItem>
                    )}
                  </For>
                </CommandGroup>
              )}
            </For>
          </Show>
        </CommandList>
      </CommandDialog>

      {props.children}
    </CommandPaletteContext.Provider>
  );
};
