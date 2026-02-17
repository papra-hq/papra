import type { Accessor, ParentComponent } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createContext, createSignal, For, onCleanup, onMount, Show, Suspense, useContext } from 'solid-js';
import { getDocumentIcon, makeDocumentSearchPermalink } from '../documents/document.models';
import { fetchOrganizationDocuments } from '../documents/documents.services';
import { useI18n } from '../i18n/i18n.provider';
import { cn } from '../shared/style/cn';
import { toArrayIf } from '../shared/utils/array';
import { useDebounce } from '../shared/utils/timing';
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
  const [getSearchQuery, setSearchQuery] = createSignal('');
  const debouncedSearchQuery = useDebounce(getSearchQuery, 300);

  const params = useParams();
  const { t } = useI18n();

  const openCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  const closeCommandPalette = () => {
    setIsCommandPaletteOpen(false);
  };

  const onCommandPaletteOpenChange = (open: boolean) => {
    if (open) {
      openCommandPalette();
    } else {
      closeCommandPalette();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openCommandPalette();
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

  const searchQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'command-palette-documents', debouncedSearchQuery()],
    queryFn: ({ signal }) => fetchOrganizationDocuments({
      organizationId: params.organizationId,
      searchQuery: debouncedSearchQuery(),
      pageIndex: 0,
      pageSize: 5,
      signal,
    }),
    enabled: debouncedSearchQuery().length > 1,
  }));

  const getMatchingDocuments = () => searchQuery.data?.documents ?? [];
  const getMatchingDocumentsTotalCount = () => searchQuery.data?.documentsCount ?? 0;

  const getCommandData = (): {
    label: string;
    forceMatch?: boolean;
    options: { label: string; icon: string; action: () => void; forceMatch?: boolean }[];
  }[] => [
    {
      label: t('command-palette.sections.documents'),
      forceMatch: true,
      options: [
        ...getMatchingDocuments().map(document => ({
          label: document.name,
          icon: getDocumentIcon({ document }),
          action: () => navigate(`/organizations/${params.organizationId}/documents/${document.id}`),
          forceMatch: true,
        })),
        ...toArrayIf(
          getMatchingDocumentsTotalCount() > getMatchingDocuments().length,
          {
            label: t('command-palette.show-more-results', { count: getMatchingDocumentsTotalCount() - getMatchingDocuments().length, query: getSearchQuery() }),
            icon: 'i-tabler-search',
            action: () => navigate(makeDocumentSearchPermalink({ organizationId: params.organizationId, search: { query: getSearchQuery() } })),
            forceMatch: true,
          },
        ),
      ],
    },
    {
      label: t('command-palette.sections.theme'),
      options: [
        {
          label: t('layout.theme.light'),
          icon: 'i-tabler-sun',
          action: () => setColorMode({ mode: 'light' }),
        },
        {
          label: t('layout.theme.dark'),
          icon: 'i-tabler-moon',
          action: () => setColorMode({ mode: 'dark' }),
        },
        {
          label: t('layout.theme.system'),
          icon: 'i-tabler-device-laptop',
          action: () => setColorMode({ mode: 'system' }),
        },
      ],
    },
  ];

  const onCommandSelect = ({ action }: { action: () => void }) => {
    action();
    closeCommandPalette();
  };

  return (
    <CommandPaletteContext.Provider value={{
      getIsCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
    }}
    >

      <CommandDialog
        class="rounded-lg border shadow-md"
        open={getIsCommandPaletteOpen()}
        onOpenChange={onCommandPaletteOpenChange}
      >

        <CommandInput
          value={getSearchQuery()}
          onValueChange={setSearchQuery}
          placeholder={t('command-palette.search.placeholder')}
        />
        <CommandList>
          <Suspense
            fallback={(
              <CommandLoading>
                <div class="i-tabler-loader-2 size-6 animate-spin text-muted-foreground mx-auto" />
              </CommandLoading>
            )}
          >
            <Show when={getMatchingDocuments().length === 0}>
              <CommandEmpty>
                {t('command-palette.no-results')}
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
          </Suspense>
        </CommandList>
      </CommandDialog>

      {props.children}
    </CommandPaletteContext.Provider>
  );
};
