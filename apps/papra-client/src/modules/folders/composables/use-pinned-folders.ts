import { createEffect, createSignal } from 'solid-js';

function getStorageKey({ organizationId }: { organizationId: string }) {
  return `papra:pinned-folders:${organizationId}`;
}

function readPinnedFolderIds({ organizationId }: { organizationId: string }): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey({ organizationId }));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// Pins are a lightweight per-browser UI preference (not synced server-side),
// similar to how the color theme is stored — deliberately kept out of the API.
export function usePinnedFolders({ organizationId }: { organizationId: string }) {
  const [getPinnedFolderIds, setPinnedFolderIds] = createSignal<string[]>(
    readPinnedFolderIds({ organizationId }),
  );

  createEffect(() => {
    try {
      localStorage.setItem(getStorageKey({ organizationId }), JSON.stringify(getPinnedFolderIds()));
    } catch {
      // Storage can fail (private browsing, quota, etc.) — pins just won't persist.
    }
  });

  const isPinned = ({ folderId }: { folderId: string }) => getPinnedFolderIds().includes(folderId);

  const togglePin = ({ folderId }: { folderId: string }) => {
    setPinnedFolderIds((ids) =>
      ids.includes(folderId) ? ids.filter((id) => id !== folderId) : [...ids, folderId],
    );
  };

  const unpin = ({ folderId }: { folderId: string }) => {
    setPinnedFolderIds((ids) => ids.filter((id) => id !== folderId));
  };

  return { getPinnedFolderIds, isPinned, togglePin, unpin };
}
