import type { Folder } from '../folders.types';

// Builds a depth-annotated, parent-first ordering of folders so a flat
// <Select> can render simple indentation and still look like a tree.
export function buildIndentedFolderList({ folders }: { folders: Folder[] }) {
  const byParentId = new Map<string | null, Folder[]>();

  for (const folder of folders) {
    const siblings = byParentId.get(folder.parentId) ?? [];
    siblings.push(folder);
    byParentId.set(folder.parentId, siblings);
  }

  for (const siblings of byParentId.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const result: Array<{ folder: Folder; depth: number }> = [];

  const visit = (parentId: string | null, depth: number) => {
    const children = byParentId.get(parentId) ?? [];
    for (const child of children) {
      result.push({ folder: child, depth });
      visit(child.id, depth + 1);
    }
  };

  visit(null, 0);

  return { indentedFolders: result };
}

// Walks parentId pointers from a target folder back up to the root, using an
// already-fetched flat folder list (cheap client-side alternative to another
// network round trip per breadcrumb segment).
export function buildFolderPath({
  folders,
  folderId,
}: {
  folders: Folder[];
  folderId?: string | null;
}) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: Folder[] = [];

  let currentId = folderId ?? null;
  const seen = new Set<string>();

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const folder = byId.get(currentId);

    if (!folder) {
      break;
    }

    path.unshift(folder);
    currentId = folder.parentId;
  }

  return { path };
}
