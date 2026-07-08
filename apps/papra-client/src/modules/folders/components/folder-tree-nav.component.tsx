import type { Component } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { fetchOrganizationFolders } from '../folders.services';
import type { Folder } from '../folders.types';
import { usePinnedFolders } from '../composables/use-pinned-folders';

function buildChildrenMap({ folders }: { folders: Folder[] }) {
  const byParentId = new Map<string | null, Folder[]>();

  for (const folder of folders) {
    const siblings = byParentId.get(folder.parentId) ?? [];
    siblings.push(folder);
    byParentId.set(folder.parentId, siblings);
  }

  for (const siblings of byParentId.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  return byParentId;
}

const FolderTreeRow: Component<{
  folder: Folder;
  depth: number;
  childrenByParentId: Map<string | null, Folder[]>;
}> = (props) => {
  const params = useParams<{ organizationId: string; folderId?: string }>();
  const [getIsExpanded, setIsExpanded] = createSignal(false);
  const { isPinned, togglePin } = usePinnedFolders({ organizationId: params.organizationId });

  const getChildren = () => props.childrenByParentId.get(props.folder.id) ?? [];
  const getHasChildren = () => getChildren().length > 0;
  const getIsActive = () => params.folderId === props.folder.id;

  return (
    <div>
      <div
        class={cn(
          'group flex items-center gap-1 rounded-md pr-1 hover:bg-accent/50 transition',
          getIsActive() && 'bg-accent/50! text-accent-foreground!',
        )}
        style={{ 'padding-left': `${props.depth * 1}rem` }}
      >
        <button
          type="button"
          class={cn(
            'size-5 flex items-center justify-center flex-shrink-0 text-muted-foreground',
            !getHasChildren() && 'invisible',
          )}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <div
            class={cn(
              'i-tabler-chevron-right size-3.5 transition-transform',
              getIsExpanded() && 'rotate-90',
            )}
          />
        </button>

        <A
          href={`/organizations/${params.organizationId}/folders/${props.folder.id}`}
          class="flex items-center gap-1.5 flex-1 min-w-0 py-1.5 text-sm dark:text-muted-foreground"
        >
          <div class="i-tabler-folder size-4 opacity-50 flex-shrink-0" />
          <span class="truncate">{props.folder.name}</span>
        </A>

        <button
          type="button"
          class={cn(
            'size-5 flex-shrink-0 items-center justify-center text-muted-foreground hover:text-primary flex',
            isPinned({ folderId: props.folder.id })
              ? 'flex text-primary'
              : 'hidden group-hover:flex',
          )}
          onClick={() => togglePin({ folderId: props.folder.id })}
        >
          <div
            class={cn(
              'size-3.5',
              isPinned({ folderId: props.folder.id }) ? 'i-tabler-star-filled' : 'i-tabler-star',
            )}
          />
        </button>
      </div>

      <Show when={getIsExpanded() && getHasChildren()}>
        <For each={getChildren()}>
          {(child) => (
            <FolderTreeRow
              folder={child}
              depth={props.depth + 1}
              childrenByParentId={props.childrenByParentId}
            />
          )}
        </For>
      </Show>
    </div>
  );
};

export const FolderTreeNav: Component = () => {
  const params = useParams<{ organizationId: string }>();

  const foldersQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'folders'],
    queryFn: async () => fetchOrganizationFolders({ organizationId: params.organizationId }),
  }));

  const getChildrenByParentId = createMemo(() =>
    buildChildrenMap({ folders: foldersQuery.data?.folders ?? [] }),
  );

  const getRootFolders = () => getChildrenByParentId().get(null) ?? [];

  return (
    <Show when={getRootFolders().length > 0}>
      <div class="flex flex-col">
        <For each={getRootFolders()}>
          {(folder) => (
            <FolderTreeRow folder={folder} depth={0} childrenByParentId={getChildrenByParentId()} />
          )}
        </For>
      </div>
    </Show>
  );
};
