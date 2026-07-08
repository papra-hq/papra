import type { FoldersRepository } from './folders.repository';
import {
  createFolderCircularReferenceError,
  createFolderMaxDepthExceededError,
  createFolderNotEmptyError,
  createFolderNotFoundError,
  createOrganizationFolderLimitReachedError,
} from './folders.errors';
import { MAX_FOLDER_NESTING_DEPTH, MAX_FOLDERS_PER_ORGANIZATION } from './folders.constants';

export async function ensureParentFolderExists({
  parentId,
  organizationId,
  foldersRepository,
}: {
  parentId?: string | null;
  organizationId: string;
  foldersRepository: FoldersRepository;
}) {
  if (!parentId) {
    return;
  }

  const { folder } = await foldersRepository.getFolderById({ folderId: parentId, organizationId });

  if (!folder) {
    throw createFolderNotFoundError();
  }
}

export async function checkIfOrganizationCanCreateNewFolder({
  organizationId,
  foldersRepository,
}: {
  organizationId: string;
  foldersRepository: FoldersRepository;
}) {
  const { foldersCount } = await foldersRepository.getOrganizationFoldersCount({ organizationId });

  if (foldersCount >= MAX_FOLDERS_PER_ORGANIZATION) {
    throw createOrganizationFolderLimitReachedError();
  }
}

export async function createFolder({
  organizationId,
  name,
  parentId,
  foldersRepository,
}: {
  organizationId: string;
  name: string;
  parentId?: string | null;
  foldersRepository: FoldersRepository;
}) {
  await checkIfOrganizationCanCreateNewFolder({ organizationId, foldersRepository });
  await ensureParentFolderExists({ parentId, organizationId, foldersRepository });

  if (parentId) {
    const { depth } = await foldersRepository.getFolderDepth({ folderId: parentId, organizationId });

    if (depth + 1 >= MAX_FOLDER_NESTING_DEPTH) {
      throw createFolderMaxDepthExceededError();
    }
  }

  const { folder } = await foldersRepository.createFolder({
    folder: { name, organizationId, parentId: parentId ?? null },
  });

  return { folder };
}

// Moving/renaming shares one endpoint (PATCH); only re-validate depth/cycles
// when parentId actually changes.
export async function moveOrRenameFolder({
  folderId,
  organizationId,
  name,
  parentId,
  foldersRepository,
}: {
  folderId: string;
  organizationId: string;
  name?: string;
  parentId?: string | null;
  foldersRepository: FoldersRepository;
}) {
  const { folder: existingFolder } = await foldersRepository.getFolderById({
    folderId,
    organizationId,
  });

  if (!existingFolder) {
    throw createFolderNotFoundError();
  }

  if (parentId !== undefined && parentId !== existingFolder.parentId) {
    if (parentId === folderId) {
      throw createFolderCircularReferenceError();
    }

    if (parentId !== null) {
      await ensureParentFolderExists({ parentId, organizationId, foldersRepository });

      const { descendantIds } = await foldersRepository.getAllDescendantFolderIds({
        folderId,
        organizationId,
      });

      if (descendantIds.includes(parentId)) {
        throw createFolderCircularReferenceError();
      }

      const { depth } = await foldersRepository.getFolderDepth({
        folderId: parentId,
        organizationId,
      });

      if (depth + 1 >= MAX_FOLDER_NESTING_DEPTH) {
        throw createFolderMaxDepthExceededError();
      }
    }
  }

  const { folder } = await foldersRepository.updateFolder({
    folderId,
    organizationId,
    name,
    parentId,
  });

  return { folder };
}

// By default refuses to delete a non-empty folder (mirrors most cloud drives'
// "move to trash" safety net); pass force to cascade-delete subfolders and
// leave contained documents orphaned at root (folderId set null by FK).
export async function deleteFolder({
  folderId,
  organizationId,
  force = false,
  foldersRepository,
}: {
  folderId: string;
  organizationId: string;
  force?: boolean;
  foldersRepository: FoldersRepository;
}) {
  const { folder } = await foldersRepository.getFolderById({ folderId, organizationId });

  if (!folder) {
    throw createFolderNotFoundError();
  }

  if (!force) {
    const { folders: childFolders, documents } = await foldersRepository.getFolderContents({
      organizationId,
      folderId,
    });

    if (childFolders.length > 0 || documents.length > 0) {
      throw createFolderNotEmptyError();
    }
  }

  await foldersRepository.deleteFolder({ folderId, organizationId });
}
