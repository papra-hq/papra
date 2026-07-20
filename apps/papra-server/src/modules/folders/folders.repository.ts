import type { Database } from '../app/database/database.types';
import { and, count, eq, getTableColumns, inArray, isNull, sql } from 'drizzle-orm';
import { injectArguments, safely } from '@corentinth/chisels';
import { documentsTable } from '../documents/documents.table';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/objects';
import { isDefined } from '../shared/utils';
import {
  createFolderAlreadyExistsError,
  createFolderNotFoundError,
} from './folders.errors';
import { foldersTable } from './folders.table';

export type FoldersRepository = ReturnType<typeof createFoldersRepository>;

export function createFoldersRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createFolder,
      getFolderById,
      getFoldersByIds,
      getOrganizationFolders,
      getOrganizationFoldersCount,
      getChildFolders,
      getFolderContents,
      updateFolder,
      deleteFolder,
      getAllDescendantFolderIds,
      getFolderDepth,
    },
    { db },
  );
}

async function createFolder({
  folder,
  db,
}: {
  folder: { name: string; organizationId: string; parentId?: string | null };
  db: Database;
}) {
  const [result, error] = await safely(db.insert(foldersTable).values(folder).returning());

  if (isUniqueConstraintError({ error })) {
    throw createFolderAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [createdFolder] = result;

  return { folder: createdFolder };
}

async function getFolderById({
  folderId,
  organizationId,
  db,
}: {
  folderId: string;
  organizationId: string;
  db: Database;
}) {
  const [folder] = await db
    .select()
    .from(foldersTable)
    .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, organizationId)));

  return { folder };
}

async function getFoldersByIds({
  folderIds,
  organizationId,
  db,
}: {
  folderIds: string[];
  organizationId: string;
  db: Database;
}) {
  if (folderIds.length === 0) {
    return { folders: [] };
  }

  const folders = await db
    .select()
    .from(foldersTable)
    .where(
      and(inArray(foldersTable.id, folderIds), eq(foldersTable.organizationId, organizationId)),
    );

  return { folders };
}

// Returns every folder in the organization along with direct subfolder + direct
// document counts, so a client can render a full folder tree in one request.
async function getOrganizationFolders({
  organizationId,
  db,
}: {
  organizationId: string;
  db: Database;
}) {
  const documentCounts = db
    .select({
      folderId: documentsTable.folderId,
      documentsCount: count(documentsTable.id).as('documentsCount'),
    })
    .from(documentsTable)
    .where(and(eq(documentsTable.organizationId, organizationId), eq(documentsTable.isDeleted, false)))
    .groupBy(documentsTable.folderId)
    .as('document_counts');

  const folders = await db
    .select({
      ...getTableColumns(foldersTable),
      documentsCount: sql<number>`COALESCE(${documentCounts.documentsCount}, 0)`.as(
        'documentsCount',
      ),
    })
    .from(foldersTable)
    .leftJoin(documentCounts, eq(foldersTable.id, documentCounts.folderId))
    .where(eq(foldersTable.organizationId, organizationId))
    .orderBy(foldersTable.name);

  return { folders };
}

async function getOrganizationFoldersCount({
  organizationId,
  db,
}: {
  organizationId: string;
  db: Database;
}) {
  const [result] = await db
    .select({ foldersCount: count() })
    .from(foldersTable)
    .where(eq(foldersTable.organizationId, organizationId));

  return { foldersCount: result?.foldersCount ?? 0 };
}

async function getChildFolders({
  organizationId,
  parentId,
  db,
}: {
  organizationId: string;
  parentId: string | null;
  db: Database;
}) {
  // Same counting join as getOrganizationFolders. Previously this was a plain
  // folder select with no count at all, which is why folder cards on the
  // "browse" view (Home page, subfolder listings) always showed 0 documents
  // regardless of actual content — the count field just wasn't there.
  const documentCounts = db
    .select({
      folderId: documentsTable.folderId,
      documentsCount: count(documentsTable.id).as('documentsCount'),
    })
    .from(documentsTable)
    .where(and(eq(documentsTable.organizationId, organizationId), eq(documentsTable.isDeleted, false)))
    .groupBy(documentsTable.folderId)
    .as('document_counts');

  const folders = await db
    .select({
      ...getTableColumns(foldersTable),
      documentsCount: sql<number>`COALESCE(${documentCounts.documentsCount}, 0)`.as(
        'documentsCount',
      ),
    })
    .from(foldersTable)
    .leftJoin(documentCounts, eq(foldersTable.id, documentCounts.folderId))
    .where(
      and(
        eq(foldersTable.organizationId, organizationId),
        parentId === null ? isNull(foldersTable.parentId) : eq(foldersTable.parentId, parentId),
      ),
    )
    .orderBy(foldersTable.name);

  return { folders };
}

// Direct contents of a folder (subfolders + non-deleted documents), for a
// Google-Drive-style "browse this folder" view.
async function getFolderContents({
  organizationId,
  folderId,
  db,
}: {
  organizationId: string;
  folderId: string | null;
  db: Database;
}) {
  const [{ folders }, documents] = await Promise.all([
    getChildFolders({ organizationId, parentId: folderId, db }),
    db
      .select()
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.organizationId, organizationId),
          eq(documentsTable.isDeleted, false),
          folderId === null
            ? isNull(documentsTable.folderId)
            : eq(documentsTable.folderId, folderId),
        ),
      )
      .orderBy(documentsTable.name),
  ]);

  return { folders, documents };
}

async function updateFolder({
  folderId,
  organizationId,
  name,
  parentId,
  db,
}: {
  folderId: string;
  organizationId: string;
  name?: string;
  parentId?: string | null;
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .update(foldersTable)
      .set(omitUndefined({ name, parentId }))
      .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, organizationId)))
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createFolderAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [folder] = result;

  if (!folder) {
    throw createFolderNotFoundError();
  }

  return { folder };
}

async function deleteFolder({
  folderId,
  organizationId,
  db,
}: {
  folderId: string;
  organizationId: string;
  db: Database;
}) {
  const deleteResult = await db
    .delete(foldersTable)
    .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, organizationId)))
    .returning({ id: foldersTable.id });

  if (deleteResult.length === 0) {
    throw createFolderNotFoundError();
  }
}

// Iterative BFS over parentId to collect every descendant of a folder.
// Used to reject moves that would create a cycle (folder into its own child).
async function getAllDescendantFolderIds({
  folderId,
  organizationId,
  db,
}: {
  folderId: string;
  organizationId: string;
  db: Database;
}): Promise<{ descendantIds: string[] }> {
  const descendantIds: string[] = [];
  let frontier = [folderId];

  while (frontier.length > 0) {
    const children = await db
      .select({ id: foldersTable.id })
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.organizationId, organizationId),
          inArray(foldersTable.parentId, frontier),
        ),
      );

    const childIds = children.map(({ id }) => id);
    descendantIds.push(...childIds);
    frontier = childIds;
  }

  return { descendantIds };
}

// Walks parentId up to the root to compute nesting depth (root folder = depth 1).
async function getFolderDepth({
  folderId,
  organizationId,
  db,
}: {
  folderId: string | null;
  organizationId: string;
  db: Database;
}): Promise<{ depth: number }> {
  let depth = 0;
  let currentId = folderId;

  // Guard against any unexpected cycle in stored data so this can never hang.
  const seen = new Set<string>();

  while (isDefined(currentId) && currentId !== null) {
    if (seen.has(currentId)) {
      break;
    }
    seen.add(currentId);

    const [folder] = await db
      .select({ parentId: foldersTable.parentId })
      .from(foldersTable)
      .where(and(eq(foldersTable.id, currentId), eq(foldersTable.organizationId, organizationId)));

    if (!folder) {
      break;
    }

    depth += 1;
    currentId = folder.parentId;
  }

  return { depth };
}
