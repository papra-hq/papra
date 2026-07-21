import type { Readable } from 'node:stream';
import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { DocumentUsecaseDependencies } from '../documents/documents.usecases';
import type { FoldersRepository } from '../folders/folders.repository';
import type { Logger } from '../shared/logger/logger';
import type { BackupsRepository } from './backups.repository';
import type { BackupsServices } from './backups.services';
import type { BackupRunTrigger, BackupSchedule } from './backups.types';
import { Readable as NodeReadable } from 'node:stream';
import { createDocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import { createDocumentCreationUsecase, restoreDocument } from '../documents/documents.usecases';
import { createFoldersRepository } from '../folders/folders.repository';
import { createFolder as createFolderUsecase } from '../folders/folders.usecases';
import { createLogger } from '../shared/logger/logger';
import { generateId } from '../shared/random/ids';
import { addTagToDocument as addTagToDocumentUsecase } from '../tags/tags.usecases';
import { createTagsRepository } from '../tags/tags.repository';
import { computeNextScheduledAt, parseScheduleDays } from './backups.models';
import { BACKUP_FILE_EXTENSION, BACKUP_FILE_MIME_TYPE, STALE_IN_PROGRESS_RUN_TIMEOUT_MS } from './backups.constants';
import { packBackupEnvelope, unpackBackupEnvelope, unwrapCredentials, wrapCredentials } from './backups.encryption.service';
import {
  createBackupAlreadyInProgressError,
  createBackupDestinationNotFoundError,
  createBackupRunNotFoundError,
  createBackupsNotConfiguredError,
} from './backups.errors';
import type { BackupDriverName } from './drivers/drivers.registry';

const logger = createLogger({ namespace: 'backups:usecases' });

export function assertBackupsConfigured({ config }: { config: Config }): void {
  if (!config.backups.kek) {
    throw createBackupsNotConfiguredError();
  }
}

// ----- Create / test / update / delete a destination -----

export async function testDestinationConnectionUsecase({
  services,
  driver,
  credentials,
  settings,
}: {
  services: BackupsServices;
  driver: BackupDriverName;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
}): Promise<{ accountLabel?: string }> {
  const backupDriver = services.getDriver(driver);
  return backupDriver.testConnection({ credentials, settings });
}

export async function createDestinationUsecase({
  config,
  services,
  repository,
  organizationId,
  driver,
  displayName,
  credentials,
  settings,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  organizationId: string;
  driver: BackupDriverName;
  displayName: string;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
}): Promise<{ destinationId: string }> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();

  const { accountLabel } = await testDestinationConnectionUsecase({ services, driver, credentials, settings });

  const dek = encryption.generateBackupKey();

  const { destination } = await repository.createDestination({
    destination: {
      id: generateId({ prefix: 'bkdst' }),
      organizationId,
      driver,
      displayName,
      settingsJson: JSON.stringify(settings ?? {}),
      encryptedCredentials: wrapCredentials({ encryption, credentials }),
      accountLabel: accountLabel ?? null,
      wrappedBackupKey: encryption.wrapWithKek({ value: dek }),
      backupKeyAlgorithm: encryption.algorithm,
      remoteFolderRef: null,
      isScheduleEnabled: false,
      scheduleDaysJson: '[]',
      scheduleHour: null,
      scheduleMinute: null,
      isEnabled: true,
    },
  });

  return { destinationId: destination.id };
}

export async function listDestinationsUsecase({
  repository,
  organizationId,
}: {
  repository: BackupsRepository;
  organizationId: string;
}) {
  const { destinations } = await repository.listDestinationsByOrganizationId({ organizationId });
  return {
    destinations: destinations.map((d) => ({
      id: d.id,
      driver: d.driver,
      displayName: d.displayName,
      settings: JSON.parse(d.settingsJson) as Record<string, unknown>,
      accountLabel: d.accountLabel,
      isEnabled: d.isEnabled,
      schedule: {
        isEnabled: d.isScheduleEnabled,
        days: parseScheduleDays(d.scheduleDaysJson),
        hour: d.scheduleHour,
        minute: d.scheduleMinute,
      } satisfies BackupSchedule,
      lastRunAt: d.lastRunAt,
      nextScheduledAt: d.nextScheduledAt,
      createdAt: d.createdAt,
    })),
  };
}

export async function updateDestinationScheduleUsecase({
  repository,
  organizationId,
  destinationId,
  schedule,
}: {
  repository: BackupsRepository;
  organizationId: string;
  destinationId: string;
  schedule: BackupSchedule;
}): Promise<{ nextScheduledAt: Date | null }> {
  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  const nextScheduledAt = computeNextScheduledAt({ schedule, from: new Date() });

  await repository.updateDestination({
    destinationId,
    fields: {
      isScheduleEnabled: schedule.isEnabled,
      scheduleDaysJson: JSON.stringify(schedule.days),
      scheduleHour: schedule.hour,
      scheduleMinute: schedule.minute,
      nextScheduledAt,
    },
  });

  return { nextScheduledAt };
}

export async function renameDestinationUsecase({
  repository,
  organizationId,
  destinationId,
  displayName,
}: {
  repository: BackupsRepository;
  organizationId: string;
  destinationId: string;
  displayName: string;
}): Promise<void> {
  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }
  await repository.updateDestination({ destinationId, fields: { displayName } });
}

export async function deleteDestinationUsecase({
  repository,
  organizationId,
  destinationId,
}: {
  repository: BackupsRepository;
  organizationId: string;
  destinationId: string;
}): Promise<{ deleted: boolean }> {
  const { deleted } = await repository.deleteDestination({ destinationId, organizationId });
  if (!deleted) {
    throw createBackupDestinationNotFoundError();
  }
  return { deleted: true };
}

// ----- List / delete runs -----

export async function listRunsUsecase({
  repository,
  destinationId,
}: {
  repository: BackupsRepository;
  destinationId: string;
}) {
  const { runs } = await repository.listRunsByDestinationId({ destinationId });
  return { runs };
}

// ----- Run a backup -----

export async function runBackupUsecase({
  config,
  services,
  repository,
  documentsRepository,
  globalDeps,
  organizationId,
  destinationId,
  trigger,
  logger: providedLogger = logger,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  documentsRepository: DocumentsRepository;
  globalDeps: Pick<import('../app/server.types').GlobalDependencies, 'db' | 'taskServices' | 'documentsStorageService' | 'eventServices'>;
  organizationId: string;
  destinationId: string;
  trigger: BackupRunTrigger;
  logger?: Logger;
}): Promise<{ runId: string }> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();

  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  await repository.markStaleInProgressRunsAsFailed({
    destinationId,
    staleBefore: new Date(Date.now() - STALE_IN_PROGRESS_RUN_TIMEOUT_MS),
    errorMessage: 'Backup marked as failed because the previous run did not complete.',
  });

  const { run: inProgress } = await repository.getInProgressRunForDestination({ destinationId });
  if (inProgress) {
    throw createBackupAlreadyInProgressError();
  }

  const { run } = await repository.createRun({
    run: {
      id: generateId({ prefix: 'bkrun' }),
      destinationId,
      organizationId,
      trigger,
      status: 'pending',
    },
  });

  // Fire and forget: the route returns immediately, the client polls run history.
  void runBackupPipeline({
    config,
    repository,
    documentsRepository,
    documentsStorageService: globalDeps.documentsStorageService,
    db: globalDeps.db,
    services,
    encryption,
    organizationId,
    destinationId,
    runId: run.id,
    logger: providedLogger,
  });

  return { runId: run.id };
}

// Builds the manifest embedded in every backup archive. Beyond basic document
// fields, this captures each document's tags (by name/color, not id — ids won't
// exist yet on a fresh install) and its full folder path (root-to-leaf names,
// same reasoning: recreate by name, don't depend on the original folder id
// still existing).
async function buildBackupManifest({
  organizationId,
  docs,
  db,
}: {
  organizationId: string;
  docs: Awaited<ReturnType<DocumentsRepository['getAllOrganizationUndeletedDocumentsForBackup']>>['documents'];
  db: import('../app/database/database.types').Database;
}) {
  const tagsRepository = createTagsRepository({ db });
  const foldersRepository = createFoldersRepository({ db });

  const { tagsByDocumentId } = await tagsRepository.getTagsByDocumentIds({ documentIds: docs.map((d) => d.id) });
  const { folders } = await foldersRepository.getOrganizationFolders({ organizationId });
  const foldersById = new Map(folders.map((f) => [f.id, f]));

  function computeFolderPath(folderId: string | null): string[] | null {
    if (!folderId) {
      return null;
    }
    const path: string[] = [];
    let current = foldersById.get(folderId);
    const seen = new Set<string>(); // guard against any accidental cycle
    while (current && !seen.has(current.id)) {
      path.unshift(current.name);
      seen.add(current.id);
      current = current.parentId ? foldersById.get(current.parentId) : undefined;
    }
    return path.length > 0 ? path : null;
  }

  return {
    schemaVersion: 2,
    organizationId,
    createdAt: new Date().toISOString(),
    documents: docs.map((d) => ({
      id: d.id,
      name: d.name,
      originalName: d.originalName,
      mimeType: d.mimeType,
      originalSize: d.originalSize,
      originalSha256Hash: d.originalSha256Hash,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      documentDate: d.documentDate,
      notes: d.notes,
      folderId: d.folderId,
      folderPath: computeFolderPath(d.folderId),
      tags: (tagsByDocumentId[d.id] ?? []).map((t) => ({ name: t.name, color: t.color, description: t.description })),
    })),
  };
}

// Everything from "fetch the org's documents" through "produce an encrypted,
// self-contained envelope" — shared by destination-based backups and by a
// direct "download a backup copy" with no destination involved at all.
async function buildEncryptedBackupEnvelope({
  organizationId,
  documentsRepository,
  documentsStorageService,
  services,
  encryption,
  dek,
  db,
  logger,
}: {
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: import('../documents/storage/documents.storage.services').DocumentStorageService;
  services: BackupsServices;
  encryption: NonNullable<BackupsServices['encryption']>;
  dek: Buffer;
  db: import('../app/database/database.types').Database;
  logger: Logger;
}): Promise<{ envelope: Buffer; documentsCount: number }> {
  const { documents: docs } = await documentsRepository.getAllOrganizationUndeletedDocumentsForBackup({ organizationId });

  const files: { name: string; content: Buffer }[] = [];
  
  for (const doc of docs) {
    try {
      const { fileStream } = await documentsStorageService.getFileStream({
        storageKey: doc.originalStorageKey,
        fileEncryptionAlgorithm: doc.fileEncryptionAlgorithm,
        fileEncryptionKekVersion: doc.fileEncryptionKekVersion,
        fileEncryptionKeyWrapped: doc.fileEncryptionKeyWrapped,
      });
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      files.push({ name: `${doc.id}-${doc.originalName.replace(/[^\w.-]/g, '_')}`, content: Buffer.concat(chunks) });
    } catch (error) {
      logger.error({ error, documentId: doc.id }, 'Failed to fetch document for backup; skipping');
    }
  }

  const manifest = await buildBackupManifest({ organizationId, docs, db });

  const archive = await services.packager.pack({ manifest, files });
  const encrypted = encryption.encryptPayload({ payload: archive, key: dek });
  const envelope = packBackupEnvelope({ wrappedKey: encryption.wrapWithKek({ value: dek }), encryptedPayload: encrypted });

  return { envelope, documentsCount: docs.length };
}

async function runBackupPipeline({
  repository,
  documentsRepository,
  documentsStorageService,
  db,
  services,
  encryption,
  organizationId,
  destinationId,
  runId,
  logger,
}: {
  config: Config;
  repository: BackupsRepository;
  documentsRepository: DocumentsRepository;
  documentsStorageService: import('../documents/storage/documents.storage.services').DocumentStorageService;
  db: import('../app/database/database.types').Database;
  services: BackupsServices;
  encryption: NonNullable<BackupsServices['encryption']>;
  organizationId: string;
  destinationId: string;
  runId: string;
  logger: Logger;
}): Promise<void> {
  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    return;
  }

  const credentials = unwrapCredentials({ encryption, wrapped: destination.encryptedCredentials });
  const dek = encryption.unwrapWithKek({ wrapped: destination.wrappedBackupKey });
  const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
  const driver = services.getDriver(destination.driver);

  try {
    const { envelope, documentsCount } = await buildEncryptedBackupEnvelope({
      organizationId,
      documentsRepository,
      documentsStorageService,
      services,
      encryption,
      dek,
      db,
      logger,
    });

    await repository.updateRunStatus({
      runId,
      status: 'uploading',
      fields: { documentsCount, totalSizeBytes: envelope.length },
    });

    let folderRef = destination.remoteFolderRef;
    if (!folderRef) {
      const folder = await driver.ensureRemoteFolder({ credentials, settings });
      folderRef = folder.folderRef;
      await repository.updateDestination({ destinationId, fields: { remoteFolderRef: folderRef } });
    }

    const fileName = `papra-backup-${organizationId.slice(-6)}-${new Date().toISOString().replace(/[:.]/g, '-')}${BACKUP_FILE_EXTENSION}`;
    const uploaded = await driver.uploadFile({
      credentials,
      settings,
      folderRef,
      fileName,
      mimeType: BACKUP_FILE_MIME_TYPE,
      content: envelope,
    });

    await repository.updateRunStatus({
      runId,
      status: 'succeeded',
      fields: {
        remoteFileId: uploaded.remoteFileId,
        remoteFileName: uploaded.remoteFileName,
        completedAt: new Date(),
      },
    });
    await repository.updateDestination({ destinationId, fields: { lastRunAt: new Date() } });

    logger.info({ runId, destinationId, size: envelope.length, documentsCount }, 'Backup run completed');
  } catch (error) {
    logger.error({ error, runId, destinationId }, 'Backup run failed');
    await repository.updateRunStatus({
      runId,
      status: 'failed',
      fields: { errorMessage: (error as Error)?.message?.slice(0, 500) ?? 'Unknown error', completedAt: new Date() },
    });
  }
}

// ----- Delete a run (removes the remote file too, best-effort) -----

export async function deleteRunUsecase({
  config,
  services,
  repository,
  organizationId,
  destinationId,
  runId,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  organizationId: string;
  destinationId: string;
  runId: string;
}): Promise<{ deleted: boolean }> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();

  const { run } = await repository.getRunById({ runId, organizationId });
  if (!run) {
    throw createBackupRunNotFoundError();
  }

  if (run.remoteFileId) {
    const { destination } = await repository.getDestinationById({ destinationId, organizationId });
    if (destination) {
      try {
        const credentials = unwrapCredentials({ encryption, wrapped: destination.encryptedCredentials });
        const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
        const driver = services.getDriver(destination.driver);
        await driver.deleteFile({ credentials, settings, remoteFileId: run.remoteFileId });
      } catch (error) {
        logger.error({ error, runId }, 'Failed to delete remote file; removing local record anyway');
      }
    }
  }

  await repository.updateRunStatus({ runId, status: 'failed', fields: { errorMessage: 'Deleted by user', completedAt: new Date() } });
  return { deleted: true };
}

// ----- Restore -----

// Shared core of "restore": given a destination we can already talk to and a
// remote file id, download + decrypt + unpack + re-import. Used both by
// restoreRunUsecase (restoring something we have local history for) and by
// restoreFromRemoteFileUsecase (disaster recovery: local DB is empty/fresh,
// but the backup still exists on the remote destination).
// The actual "unwrap key, decrypt, unpack, re-import" work, independent of
// where the envelope bytes came from. Used both by the driver-based restore
// (destination downloads the file) and by restoring a file the person already
// has in hand and just uploads directly — no destination, no driver, no
// connection to anything at all, just the file + your BACKUPS_KEK.
async function restoreFromEnvelopeUsecase({
  services,
  documentUsecaseDeps,
  documentsRepository,
  foldersRepository,
  organizationId,
  envelope,
  userId,
}: {
  services: BackupsServices;
  documentUsecaseDeps: import('../app/server.types').GlobalDependencies;
  documentsRepository: DocumentsRepository;
  foldersRepository: FoldersRepository;
  organizationId: string;
  envelope: Buffer;
  userId?: string;
}): Promise<{
  restoredDocumentsCount: number;
  untrashedDocumentsCount: number;
  skippedDuplicatesCount: number;
  totalDocumentsCount: number;
}> {
  const encryption = services.requireEncryption();

  const { wrappedKey, encryptedPayload } = unpackBackupEnvelope({ envelope });
  const dek = encryption.unwrapWithKek({ wrapped: wrappedKey });

  const archive = encryption.decryptPayload({ encryptedPayload, key: dek });
  const { manifest, files: unpackedFiles } = await services.packager.unpack({ archive });

  const manifestDocs = (manifest as {
    documents: {
      id: string;
      originalName: string;
      mimeType: string;
      originalSha256Hash: string;
      createdAt?: string | Date;
      documentDate?: string | Date | null;
      notes?: string | null;
      folderId: string | null;
      folderPath?: string[] | null;
      tags?: { name: string; color: string; description?: string | null }[];
    }[];
  }).documents;

  const createDocument = createDocumentCreationUsecase({ ...documentUsecaseDeps });
  const tagsRepository = createTagsRepository({ db: documentUsecaseDeps.db });
  const documentActivityRepository = createDocumentActivityRepository({ db: documentUsecaseDeps.db });

  // ----- Folder resolution: prefer the original id if it still exists (fast,
  // common case for a same-install restore); otherwise recreate the folder
  // path by name (the fresh-install / "folder got deleted" case). Memoized so
  // many documents sharing a folder only create it once per run. -----
  const folderIdExistsCache = new Map<string, boolean>();
  const folderPathCache = new Map<string, string>(); // key: `${parentId ?? 'root'}::${name}` -> folder id

  async function resolveOrRecreateFolderId(entry: { folderId: string | null; folderPath?: string[] | null }): Promise<string | undefined> {
    if (entry.folderId) {
      if (!folderIdExistsCache.has(entry.folderId)) {
        const { folder } = await foldersRepository.getFolderById({ folderId: entry.folderId, organizationId });
        folderIdExistsCache.set(entry.folderId, Boolean(folder));
      }
      if (folderIdExistsCache.get(entry.folderId)) {
        return entry.folderId;
      }
    }

    if (!entry.folderPath || entry.folderPath.length === 0) {
      return undefined;
    }

    let parentId: string | undefined;
    for (const name of entry.folderPath) {
      const cacheKey = `${parentId ?? 'root'}::${name}`;
      let folderId = folderPathCache.get(cacheKey);

      if (!folderId) {
        const { folders: siblings } = await foldersRepository.getChildFolders({ organizationId, parentId: parentId ?? null });
        const existingFolder = siblings.find((f) => f.name === name);
        if (existingFolder) {
          folderId = existingFolder.id;
        } else {
          try {
            const { folder } = await createFolderUsecase({ organizationId, name, parentId, foldersRepository });
            folderId = folder!.id;
          } catch (error) {
            logger.error({ error, name, parentId }, 'Failed to recreate folder during restore; falling back to its parent');
            break;
          }
        }
        folderPathCache.set(cacheKey, folderId);
      }
      parentId = folderId;
    }

    return parentId;
  }

  // ----- Tag resolution: match by name within the org, create if missing. -----
  const { tags: existingOrgTags } = await tagsRepository.getOrganizationTags({ organizationId });
  const tagIdByName = new Map<string, string>(existingOrgTags.map((t) => [t.name, t.id]));

  async function resolveTagId(tag: { name: string; color: string; description?: string | null }): Promise<string | undefined> {
    const existingId = tagIdByName.get(tag.name);
    if (existingId) {
      return existingId;
    }
    try {
      const { tag: created } = await tagsRepository.createTag({
        tag: { organizationId, name: tag.name, color: tag.color, description: tag.description ?? undefined },
      });
      tagIdByName.set(tag.name, created!.id);
      return created!.id;
    } catch (error) {
      // Another entry in this same restore run may have created it a moment
      // ago (race within this loop is unlikely since we're sequential, but a
      // concurrent request isn't impossible) — re-check before giving up.
      const { tags: refreshed } = await tagsRepository.getOrganizationTags({ organizationId });
      const match = refreshed.find((t) => t.name === tag.name);
      if (match) {
        tagIdByName.set(tag.name, match.id);
        return match.id;
      }
      logger.error({ error, tagName: tag.name }, 'Failed to resolve/create tag during restore; skipping this tag');
      return undefined;
    }
  }

  async function applyTagsToDocument({
    documentId,
    tags = [],
  }: {
    documentId: string;
    tags?: { name: string; color: string; description?: string | null }[];
  }): Promise<void> {
    if (tags.length === 0) {
      return;
    }
    const { tagsByDocumentId } = await tagsRepository.getTagsByDocumentIds({ documentIds: [documentId] });
    const alreadyAttached = new Set((tagsByDocumentId[documentId] ?? []).map((t) => t.id));

    for (const tag of tags) {
      const tagId = await resolveTagId(tag);
      if (!tagId || alreadyAttached.has(tagId)) {
        continue;
      }
      try {
        await addTagToDocumentUsecase({
          tagId,
          documentId,
          organizationId,
          userId,
          tag: { ...tag, id: tagId, organizationId } as Parameters<typeof addTagToDocumentUsecase>[0]['tag'],
          tagsRepository,
          webhookTriggerServices: documentUsecaseDeps.webhookTriggerServices,
          documentActivityRepository,
        });
      } catch (error) {
        logger.error({ error, documentId, tagName: tag.name }, 'Failed to attach tag to restored document; skipping this tag');
      }
    }
  }

  async function applyMetadata({
    documentId,
    entry,
  }: {
    documentId: string;
    entry: (typeof manifestDocs)[number];
  }): Promise<void> {
    try {
      await documentsRepository.updateDocument({
        documentId,
        organizationId,
        documentDate: entry.documentDate ? new Date(entry.documentDate) : undefined,
        notes: entry.notes ?? undefined,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
      });
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to restore document metadata (date/notes); document content is still intact');
    }
  }

  let restoredCount = 0;
  let untrashedCount = 0;
  let skippedCount = 0;

  for (const entry of manifestDocs) {
    const matchingFileKey = [...unpackedFiles.keys()].find((name) => name.startsWith(`${entry.id}-`));
    if (!matchingFileKey) {
      continue;
    }
    const content = unpackedFiles.get(matchingFileKey)!;

    // On a fresh install this will always be undefined (empty documents table),
    // so every manifest entry goes through createDocument below. On a
    // non-fresh install, this is what makes restore safe to re-run.
    const { document: existing } = await documentsRepository.getOrganizationDocumentBySha256Hash({
      sha256Hash: entry.originalSha256Hash,
      organizationId,
    });

    if (existing) {
      // Soft-deleted (trashed) rows still match by hash — bring those back
      // rather than leaving them stuck in trash while reporting "already there".
      if (existing.isDeleted) {
        try {
          await restoreDocument({
            documentId: existing.id,
            organizationId,
            userId: userId ?? '',
            documentsRepository,
            eventServices: documentUsecaseDeps.eventServices,
          });
          await applyMetadata({ documentId: existing.id, entry });
          await applyTagsToDocument({ documentId: existing.id, tags: entry.tags });
          untrashedCount += 1;
        } catch (error) {
          logger.error({ error, documentId: existing.id }, 'Failed to untrash document during restore; skipping');
        }
        continue;
      }

      skippedCount += 1;
      continue;
    }

    const folderId = await resolveOrRecreateFolderId(entry);
    const fileStream: Readable = NodeReadable.from(content);

    try {
      const { document } = await createDocument({
        fileStream,
        fileName: entry.originalName,
        mimeType: entry.mimeType,
        userId,
        organizationId,
        folderId,
      });
      await applyMetadata({ documentId: document.id, entry });
      await applyTagsToDocument({ documentId: document.id, tags: entry.tags });
      restoredCount += 1;
    } catch (error) {
      logger.error({ error, documentId: entry.id }, 'Failed to restore document from backup; skipping');
    }
  }

  return {
    restoredDocumentsCount: restoredCount,
    untrashedDocumentsCount: untrashedCount,
    skippedDuplicatesCount: skippedCount,
    totalDocumentsCount: manifestDocs.length,
  };
}

// Driver-based restore: destination downloads the envelope file, then hands off
// to the shared core above.
async function restoreArchiveUsecase({
  services,
  documentUsecaseDeps,
  documentsRepository,
  foldersRepository,
  organizationId,
  destination,
  remoteFileId,
  userId,
}: {
  services: BackupsServices;
  documentUsecaseDeps: import('../app/server.types').GlobalDependencies;
  documentsRepository: DocumentsRepository;
  foldersRepository: FoldersRepository;
  organizationId: string;
  destination: import('./backups.types').BackupDestination;
  remoteFileId: string;
  userId?: string;
}) {
  const encryption = services.requireEncryption();
  const credentials = unwrapCredentials({ encryption, wrapped: destination.encryptedCredentials });
  const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
  const driver = services.getDriver(destination.driver);

  const envelope = await driver.downloadFile({ credentials, settings, remoteFileId });

  return restoreFromEnvelopeUsecase({
    services,
    documentUsecaseDeps,
    documentsRepository,
    foldersRepository,
    organizationId,
    envelope,
    userId,
  });
}

// ----- Download a backup copy directly, no destination involved at all — a
// one-off manual export straight to the browser. Gets its own random key (like
// every backup), wrapped and embedded in the same envelope, same as any other
// backup. Nothing about this run is persisted anywhere; it's not tracked in
// run history since there's no destination for it to belong to. -----

export async function downloadBackupCopyUsecase({
  config,
  services,
  documentsRepository,
  documentsStorageService,
  organizationId,
  db,
  logger: providedLogger = logger,
}: {
  config: Config;
  services: BackupsServices;
  documentsRepository: DocumentsRepository;
  documentsStorageService: import('../documents/storage/documents.storage.services').DocumentStorageService;
  organizationId: string;
  db: import('../app/database/database.types').Database;
  logger?: Logger;
}): Promise<{ envelope: Buffer; fileName: string; documentsCount: number }> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();
  const dek = encryption.generateBackupKey();

  const { envelope, documentsCount } = await buildEncryptedBackupEnvelope({
    organizationId,
    documentsRepository,
    documentsStorageService,
    services,
    encryption,
    dek,
    db,
    logger: providedLogger,
  });

  const fileName = `papra-backup-${organizationId.slice(-6)}-${new Date().toISOString().replace(/[:.]/g, '-')}${BACKUP_FILE_EXTENSION}`;

  return { envelope, fileName, documentsCount };
}

// ----- Restore directly from an uploaded file — no destination, no driver, no
// connection to anything at all. You already have the file (copied off your
// phone, an SD card, wherever); this just needs it + your BACKUPS_KEK. -----

export async function restoreFromUploadedFileUsecase({
  config,
  services,
  documentUsecaseDeps,
  documentsRepository,
  foldersRepository,
  organizationId,
  envelope,
  userId,
}: {
  config: Config;
  services: BackupsServices;
  documentUsecaseDeps: import('../app/server.types').GlobalDependencies;
  documentsRepository: DocumentsRepository;
  foldersRepository: FoldersRepository;
  organizationId: string;
  envelope: Buffer;
  userId?: string;
}) {
  assertBackupsConfigured({ config });

  return restoreFromEnvelopeUsecase({
    services,
    documentUsecaseDeps,
    documentsRepository,
    foldersRepository,
    organizationId,
    envelope,
    userId,
  });
}

// ----- Restore from local run history (normal case: same install that took the backup) -----

export async function restoreRunUsecase({
  config,
  services,
  repository,
  documentUsecaseDeps,
  documentsRepository,
  foldersRepository,
  organizationId,
  destinationId,
  runId,
  userId,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  documentUsecaseDeps: import('../app/server.types').GlobalDependencies;
  documentsRepository: DocumentsRepository;
  foldersRepository: FoldersRepository;
  organizationId: string;
  destinationId: string;
  runId: string;
  userId?: string;
}) {
  assertBackupsConfigured({ config });

  const { run } = await repository.getRunById({ runId, organizationId });
  if (!run || !run.remoteFileId) {
    throw createBackupRunNotFoundError();
  }
  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  return restoreArchiveUsecase({
    services,
    documentUsecaseDeps,
    documentsRepository,
    foldersRepository,
    organizationId,
    destination,
    remoteFileId: run.remoteFileId,
    userId,
  });
}

// ----- Disaster recovery: list + restore backups that exist on a destination -----
// even when the local database (destinations, run history) has no record of them
// — e.g. a fresh install, or an install pointed at a fresh/empty database while
// the remote destination still has the old backups sitting on it.

export async function listRemoteBackupsUsecase({
  config,
  services,
  repository,
  organizationId,
  destinationId,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  organizationId: string;
  destinationId: string;
}): Promise<{ files: { remoteFileId: string; name: string; size?: number; modifiedAt?: Date }[] }> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();

  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  const credentials = unwrapCredentials({ encryption, wrapped: destination.encryptedCredentials });
  const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
  const driver = services.getDriver(destination.driver);

  let folderRef = destination.remoteFolderRef;
  if (!folderRef) {
    const folder = await driver.ensureRemoteFolder({ credentials, settings });
    folderRef = folder.folderRef;
    await repository.updateDestination({ destinationId, fields: { remoteFolderRef: folderRef } });
  }

  const { files } = await driver.listFiles({ credentials, settings, folderRef });
  return { files: files.filter((f) => f.name.endsWith(BACKUP_FILE_EXTENSION)) };
}

export async function restoreFromRemoteFileUsecase({
  config,
  services,
  repository,
  documentUsecaseDeps,
  documentsRepository,
  foldersRepository,
  organizationId,
  destinationId,
  remoteFileId,
  userId,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  documentUsecaseDeps: import('../app/server.types').GlobalDependencies;
  documentsRepository: DocumentsRepository;
  foldersRepository: FoldersRepository;
  organizationId: string;
  destinationId: string;
  remoteFileId: string;
  userId?: string;
}) {
  assertBackupsConfigured({ config });

  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  return restoreArchiveUsecase({
    services,
    documentUsecaseDeps,
    documentsRepository,
    foldersRepository,
    organizationId,
    destination,
    remoteFileId,
    userId,
  });
}


// ----- Scheduler tick (called by tasks/backup-scheduler-tick.task.ts) -----

export async function runDueScheduledBackupsUsecase({
  config,
  services,
  repository,
  documentsRepository,
  globalDeps,
  now = new Date(),
  logger: providedLogger = logger,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  documentsRepository: DocumentsRepository;
  globalDeps: Pick<import('../app/server.types').GlobalDependencies, 'db' | 'taskServices' | 'documentsStorageService' | 'eventServices'>;
  now?: Date;
  logger?: Logger;
}): Promise<{ triggeredCount: number }> {
  if (!config.backups.kek) {
    return { triggeredCount: 0 };
  }

  const { destinations } = await repository.getDueScheduledDestinations({ now });
  let triggeredCount = 0;

  for (const destination of destinations) {
    try {
      await runBackupUsecase({
        config,
        services,
        repository,
        documentsRepository,
        globalDeps,
        organizationId: destination.organizationId,
        destinationId: destination.id,
        trigger: 'scheduled',
        logger: providedLogger,
      });
      triggeredCount += 1;
    } catch (error) {
      providedLogger.error({ error, destinationId: destination.id }, 'Scheduled backup failed to start');
    }

    // Recompute the next occurrence regardless of success/failure, so a failure
    // doesn't cause the scheduler to hammer the destination every 15 minutes.
    const schedule: BackupSchedule = {
      isEnabled: destination.isScheduleEnabled,
      days: parseScheduleDays(destination.scheduleDaysJson),
      hour: destination.scheduleHour,
      minute: destination.scheduleMinute,
    };
    const nextScheduledAt = computeNextScheduledAt({ schedule, from: now });
    await repository.updateDestination({ destinationId: destination.id, fields: { nextScheduledAt } });
  }

  return { triggeredCount };
}

// ----- Backup Verification -----

export async function verifyBackupRunUsecase({
  config,
  services,
  repository,
  documentsStorageService,
  organizationId,
  destinationId,
  runId,
}: {
  config: Config;
  services: BackupsServices;
  repository: BackupsRepository;
  documentsStorageService: import('../documents/storage/documents.storage.services').DocumentStorageService;
  organizationId: string;
  destinationId: string;
  runId: string;
}): Promise<{
  valid: boolean;
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  errors: string[];
}> {
  assertBackupsConfigured({ config });
  const encryption = services.requireEncryption();

  // Get the run and destination
  const { run } = await repository.getRunById({ runId, organizationId });
  if (!run || !run.remoteFileId) {
    throw createBackupRunNotFoundError();
  }

  const { destination } = await repository.getDestinationById({ destinationId, organizationId });
  if (!destination) {
    throw createBackupDestinationNotFoundError();
  }

  const errors: string[] = [];

  try {
    // Download the backup file
    const credentials = unwrapCredentials({ encryption, wrapped: destination.encryptedCredentials });
    const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
    const driver = services.getDriver(destination.driver);

    const envelope = await driver.downloadFile({ credentials, settings, remoteFileId: run.remoteFileId });

    // Unpack and verify
    const { wrappedKey, encryptedPayload } = unpackBackupEnvelope({ envelope });
    const dek = encryption.unwrapWithKek({ wrapped: wrappedKey });
    
    const archive = encryption.decryptPayload({ encryptedPayload, key: dek });
    const { manifest, files: unpackedFiles } = await services.packager.unpack({ archive });

    const manifestDocs = (manifest as {
      documents: {
        id: string;
        originalSha256Hash: string;
      }[];
    }).documents;

    // Verify each document's hash
    let validCount = 0;
    let invalidCount = 0;

    for (const doc of manifestDocs) {
      // Find the file in the archive that matches this document
      // Files are named as "files/{doc.id}-{originalName}" in the tar archive
      // After unpacking, the key is just "{doc.id}-{originalName}"
      const fileKey = Array.from(unpackedFiles.keys()).find((key) => key.startsWith(`${doc.id}-`));
      if (!fileKey) {
        errors.push(`Document ${doc.id}: file not found in backup archive`);
        invalidCount++;
        continue;
      }

      const content = unpackedFiles.get(fileKey)!;
      const actualHash = services.packager.computeHash(content);
      
      if (actualHash !== doc.originalSha256Hash) {
        errors.push(`Document ${doc.id}: hash mismatch (expected ${doc.originalSha256Hash}, got ${actualHash})`);
        invalidCount++;
      } else {
        validCount++;
      }
    }

    return {
      valid: errors.length === 0,
      totalDocuments: manifestDocs.length,
      validDocuments: validCount,
      invalidDocuments: invalidCount,
      errors,
    };
  } catch (error) {
    errors.push((error as Error).message);
    return {
      valid: false,
      totalDocuments: 0,
      validDocuments: 0,
      invalidDocuments: 0,
      errors,
    };
  }
}
