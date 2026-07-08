import type { Component } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createMemo, For, Show } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { fetchOrganizationFolders } from '../folders.services';
import { usePinnedFolders } from '../composables/use-pinned-folders';

export const PinnedFoldersNav: Component = () => {
  const params = useParams<{ organizationId: string; folderId?: string }>();
  const { getPinnedFolderIds, unpin } = usePinnedFolders({ organizationId: params.organizationId });

  const foldersQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'folders'],
    queryFn: async () => fetchOrganizationFolders({ organizationId: params.organizationId }),
  }));

  const getPinnedFolders = createMemo(() => {
    const folders = foldersQuery.data?.folders ?? [];
    const byId = new Map(folders.map((folder) => [folder.id, folder]));

    return getPinnedFolderIds()
      .map((id) => byId.get(id))
      .filter((folder) => folder !== undefined);
  });

  return (
    <Show when={getPinnedFolders().length > 0}>
      <nav class="flex flex-col gap-0.5">
        <For each={getPinnedFolders()}>
          {(folder) => (
            <div
              class={cn(
                'group flex items-center rounded-md hover:bg-accent/50 transition',
                params.folderId === folder.id && 'bg-accent/50! text-accent-foreground!',
              )}
            >
              <A
                href={`/organizations/${params.organizationId}/folders/${folder.id}`}
                class="flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 text-sm dark:text-muted-foreground"
              >
                <div class="i-tabler-star-filled size-4 text-primary flex-shrink-0" />
                <span class="truncate">{folder.name}</span>
              </A>
              <button
                type="button"
                class="size-6 mr-1 flex-shrink-0 items-center justify-center text-muted-foreground hover:text-foreground hidden group-hover:flex"
                onClick={() => unpin({ folderId: folder.id })}
              >
                <div class="i-tabler-x size-3.5" />
              </button>
            </div>
          )}
        </For>
      </nav>
    </Show>
  );
};
