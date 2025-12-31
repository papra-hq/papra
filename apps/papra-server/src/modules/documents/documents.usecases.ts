import type { Readable } from 'node:stream';
import type { Database } from '../app/database/database.types';
import type { EventServices } from '../app/events/events.services';
import type { Config } from '../config/config.types';
import type { PlansRepository } from '../plans/plans.repository';
import type { Logger } from '../shared/logger/logger';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { TaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import type { TagsRepository } from '../tags/tags.repository';
import type { TaskServices } from '../tasks/tasks.services';
import type { WebhookRepository } from '../webhooks/webhook.repository';
import type { DocumentActivityRepository } from './document-activity/document-activity.repository';
import type { DocumentsRepository } from './documents.repository';
import type { Document } from './documents.types';
import type { DocumentStorageService } from './storage/documents.storage.services';
import type { EncryptionContext } from './storage/drivers/drivers.models';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { safely } from '@corentinth/chisels';
import pLimit from 'p-limit';
import { createOrganizationDocumentStorageLimitReachedError } from '../organizations/organizations.errors';
import { getOrganizationStorageLimits } from '../organizations/organizations.usecases';
import { createPlansRepository } from '../plans/plans.repository';
import { createLogger } from '../shared/logger/logger';
import { createByteCounter } from '../shared/streams/byte-counter';
import { createSha256HashTransformer } from '../shared/streams/stream-hash';
import { collectStreamToFile } from '../shared/streams/stream.convertion';
import { isNil } from '../shared/utils';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createTaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import { applyTaggingRules } from '../tagging-rules/tagging-rules.usecases';
import { createTagsRepository } from '../tags/tags.repository';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { createDocumentActivityRepository } from './document-activity/document-activity.repository';
import { createDocumentAlreadyExistsError, createDocumentNotDeletedError, createDocumentNotFoundError, createDocumentSizeTooLargeError } from './documents.errors';
import { buildOriginalDocumentKey, generateDocumentId as generateDocumentIdImpl } from './documents.models';
import { createDocumentsRepository } from './documents.repository';
import { extractDocumentText } from './documents.services';

type DocumentStorageContext = {
  storageKey: string;
} & EncryptionContext;

export async function createDocument({
  fileStream,
  fileName,
  mimeType,
  userId,
  organizationId,
  ocrLanguages = [],
  documentsRepository,
  documentsStorageService,
  generateDocumentId = generateDocumentIdImpl,
  plansRepository,
  subscriptionsRepository,
  taggingRulesRepository,
  tagsRepository,
  webhookRepository,
  documentActivityRepository,
  eventServices,
  taskServices,
  logger = createLogger({ namespace: 'documents:usecases' }),
}: {
  fileStream: Readable;
  fileName: string;
  mimeType: string;
  userId?: string;
  organizationId: string;
  ocrLanguages?: string[];
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  generateDocumentId?: () => string;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  taggingRulesRepository: TaggingRulesRepository;
  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
  eventServices: EventServices;
  taskServices: TaskServices;
  logger?: Logger;
}) {
  const { availableDocumentStorageBytes, maxFileSize } = await getOrganizationStorageLimits({ organizationId, plansRepository, subscriptionsRepository, documentsRepository });

  const documentId = generateDocumentId();
  const { originalDocumentStorageKey } = buildOriginalDocumentKey({ documentId, organizationId, fileName });

  const { tap: hashStream, getHash } = createSha256HashTransformer();

  // Stream that will count the bytes of the file and throw an error if the file size exceeds the organization storage limit
  const { tap: byteCountStream, getByteCount } = createByteCounter({
    onByteCountChange: async ({ byteCount, destroy }) => {
      if (byteCount > availableDocumentStorageBytes) {
        destroy({ error: createOrganizationDocumentStorageLimitReachedError() });
      }

      if (byteCount > maxFileSize) {
        destroy({ error: createDocumentSizeTooLargeError() });
      }
    },
  });

  // Create a PassThrough stream that will be used for saving the file
  // This allows us to use pipeline for better error handling
  const outputStream = new PassThrough();

  const streamProcessingPromise = pipeline(
    fileStream,
    hashStream,
    byteCountStream,
    outputStream,
  );

  // We optimistically save the file to leverage streaming, if the file already exists, we will delete it
  const [newFileStorageContext] = await Promise.all([
    documentsStorageService.saveFile({
      fileStream: outputStream,
      storageKey: originalDocumentStorageKey,
      mimeType,
      fileName,
    }),
    streamProcessingPromise,
  ]);

  const hash = getHash();
  const size = getByteCount();

  // Early check to avoid saving the file and then realizing it already exists with the db constraint
  const { document: existingDocument } = await documentsRepository.getOrganizationDocumentBySha256Hash({ sha256Hash: hash, organizationId });

  const { document } = existingDocument
    ? await handleExistingDocument({
        existingDocument,
        fileName,
        organizationId,
        documentsRepository,
        newDocumentStorageKey: newFileStorageContext.storageKey,
        tagsRepository,
        taggingRulesRepository,
        webhookRepository,
        documentActivityRepository,
        documentsStorageService,
        logger,
      })
    : await createNewDocument({
        newFileStorageContext,
        fileName,
        size,
        mimeType,
        hash,
        userId,
        organizationId,
        documentsRepository,
        documentsStorageService,
        plansRepository,
        subscriptionsRepository,
        documentId,
        taskServices,
        ocrLanguages,
        logger,
      });

  eventServices.emitEvent({
    eventName: 'document.created',
    payload: { document },
  });

  return { document };
}

export type CreateDocumentUsecase = Awaited<ReturnType<typeof createDocumentCreationUsecase>>;
export type DocumentUsecaseDependencies = Omit<Parameters<typeof createDocument>[0], 'fileStream' | 'fileName' | 'mimeType' | 'userId' | 'organizationId'>;

export function createDocumentCreationUsecase({
  db,
  config,
  taskServices,
  documentsStorageService,
  eventServices,
  ...initialDeps
}: {
  db: Database;
  taskServices: TaskServices;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
  config: Config;
} & Partial<DocumentUsecaseDependencies>) {
  const deps = {
    documentsRepository: initialDeps.documentsRepository ?? createDocumentsRepository({ db }),
    plansRepository: initialDeps.plansRepository ?? createPlansRepository({ config }),
    subscriptionsRepository: initialDeps.subscriptionsRepository ?? createSubscriptionsRepository({ db }),
    taggingRulesRepository: initialDeps.taggingRulesRepository ?? createTaggingRulesRepository({ db }),
    tagsRepository: initialDeps.tagsRepository ?? createTagsRepository({ db }),
    webhookRepository: initialDeps.webhookRepository ?? createWebhookRepository({ db }),
    documentActivityRepository: initialDeps.documentActivityRepository ?? createDocumentActivityRepository({ db }),

    ocrLanguages: initialDeps.ocrLanguages ?? config.documents.ocrLanguages,
    generateDocumentId: initialDeps.generateDocumentId,
    logger: initialDeps.logger,
  };

  return async (args: {
    fileStream: Readable;
    fileName: string;
    mimeType: string;
    userId?: string;
    organizationId: string;
  }) => createDocument({ taskServices, documentsStorageService, eventServices, ...args, ...deps });
}

async function handleExistingDocument({
  existingDocument,
  fileName,
  userId,
  organizationId,
  documentsRepository,
  tagsRepository,
  taggingRulesRepository,
  webhookRepository,
  documentActivityRepository,
  documentsStorageService,
  newDocumentStorageKey,
  logger,
}: {
  existingDocument: Document;
  fileName: string;
  userId?: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  taggingRulesRepository: TaggingRulesRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
  documentsStorageService: DocumentStorageService;
  newDocumentStorageKey: string;
  logger: Logger;
}) {
  // Delete the newly uploaded file since we'll be using the existing document's file
  await documentsStorageService.deleteFile({ storageKey: newDocumentStorageKey });

  if (!existingDocument.isDeleted) {
    throw createDocumentAlreadyExistsError();
  }

  logger.info({ documentId: existingDocument.id }, 'Document already exists, restoring for deduplication');

  const [, { document: restoredDocument }] = await Promise.all([
    tagsRepository.removeAllTagsFromDocument({ documentId: existingDocument.id }),
    documentsRepository.restoreDocument({ documentId: existingDocument.id, organizationId, name: fileName, userId }),
  ]);

  await applyTaggingRules({ document: restoredDocument, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

  return { document: restoredDocument };
}

async function createNewDocument({
  fileName,
  size,
  mimeType,
  hash,
  userId,
  organizationId,
  plansRepository,
  subscriptionsRepository,
  documentsRepository,
  documentsStorageService,
  newFileStorageContext,
  documentId,
  taskServices,
  ocrLanguages = [],
  logger,
}: {
  fileName: string;
  size: number;
  mimeType: string;
  hash: string;
  userId?: string;
  organizationId: string;
  documentId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  newFileStorageContext: DocumentStorageContext;
  taskServices: TaskServices;
  ocrLanguages?: string[];
  logger: Logger;
}) {
  // TODO: wrap in a transaction

  // Recheck for quota after saving the file to the storage
  const { availableDocumentStorageBytes } = await getOrganizationStorageLimits({ organizationId, plansRepository, subscriptionsRepository, documentsRepository });

  if (size > availableDocumentStorageBytes) {
    logger.error({ size, availableDocumentStorageBytes }, 'Document size exceeds organization storage limit after being saved');
    await documentsStorageService.deleteFile({ storageKey: newFileStorageContext.storageKey });

    throw createOrganizationDocumentStorageLimitReachedError();
  }

  const [result, error] = await safely(documentsRepository.saveOrganizationDocument({
    id: documentId,
    name: fileName,
    organizationId,
    originalName: fileName,
    createdBy: userId,
    originalSize: size,
    originalStorageKey: newFileStorageContext.storageKey,
    fileEncryptionAlgorithm: newFileStorageContext.fileEncryptionAlgorithm,
    fileEncryptionKekVersion: newFileStorageContext.fileEncryptionKekVersion,
    fileEncryptionKeyWrapped: newFileStorageContext.fileEncryptionKeyWrapped,
    mimeType,
    originalSha256Hash: hash,
  }));

  if (error) {
    logger.error({ error }, 'Error while creating document');

    // If the document is not saved, delete the file from the storage
    await documentsStorageService.deleteFile({ storageKey: newFileStorageContext.storageKey });

    logger.error({ error }, 'Stored document file deleted because of error');

    throw error;
  }

  const { document } = result;

  await taskServices.scheduleJob({
    taskName: 'extract-document-file-content',
    data: { documentId, organizationId, ocrLanguages },
  });

  logger.info({ documentId, userId, organizationId, mimeType }, 'Document created');

  return { document };
}

export async function getDocumentOrThrow({
  documentId,
  organizationId,
  documentsRepository,
}: {
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  return { document };
}

export async function ensureDocumentExists({
  documentId,
  organizationId,
  documentsRepository,
}: {
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
}) {
  await getDocumentOrThrow({ documentId, organizationId, documentsRepository });
}

export async function hardDeleteDocument({
  document,
  documentsRepository,
  documentsStorageService,
  eventServices,
}: {
  document: Pick<Document, 'id' | 'originalStorageKey' | 'organizationId'>;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
}) {
  await Promise.all([
    documentsRepository.hardDeleteDocument({ documentId: document.id }),
    documentsStorageService.deleteFile({ storageKey: document.originalStorageKey }),
  ]);

  eventServices.emitEvent({
    eventName: 'document.deleted',
    payload: { documentId: document.id, organizationId: document.organizationId },
  });
}

export async function deleteExpiredDocuments({
  documentsRepository,
  documentsStorageService,
  eventServices,
  config,
  now = new Date(),
  logger = createLogger({ namespace: 'documents:deleteExpiredDocuments' }),
}: {
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
  config: Config;
  now?: Date;
  logger?: Logger;
}) {
  const { documents } = await documentsRepository.getExpiredDeletedDocuments({
    expirationDelayInDays: config.documents.deletedDocumentsRetentionDays,
    now,
  });

  const limit = pLimit(10);

  await Promise.all(
    documents.map(async document => limit(async () => {
      const [, error] = await safely(hardDeleteDocument({ document, documentsRepository, documentsStorageService, eventServices }));

      if (error) {
        logger.error({ document, error }, 'Error while deleting expired document');
      }
    })),
  );

  return {
    deletedDocumentsCount: documents.length,
  };
}

export async function deleteTrashDocument({
  documentId,
  organizationId,
  documentsRepository,
  documentsStorageService,
  eventServices,
}: {
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  if (!document.isDeleted) {
    throw createDocumentNotDeletedError();
  }

  await hardDeleteDocument({ document, documentsRepository, documentsStorageService, eventServices });
}

export async function deleteAllTrashDocuments({
  organizationId,
  documentsRepository,
  documentsStorageService,
  eventServices,
}: {
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
}) {
  const { documents } = await documentsRepository.getAllOrganizationTrashDocuments({ organizationId });

  // TODO: refactor to use batching and transaction

  const limit = pLimit(10);

  await Promise.all(
    documents.map(async document => limit(async () => {
      await hardDeleteDocument({ document, documentsRepository, documentsStorageService, eventServices });
    })),
  );
}

export async function extractAndSaveDocumentFileContent({
  documentId,
  organizationId,
  documentsRepository,
  documentsStorageService,
  ocrLanguages,
  taggingRulesRepository,
  tagsRepository,
  webhookRepository,
  documentActivityRepository,
  eventServices,
}: {
  documentId: string;
  ocrLanguages?: string[];
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  taggingRulesRepository: TaggingRulesRepository;
  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
  eventServices: EventServices;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  const { fileStream } = await documentsStorageService.getFileStream({
    storageKey: document.originalStorageKey,
    fileEncryptionAlgorithm: document.fileEncryptionAlgorithm,
    fileEncryptionKekVersion: document.fileEncryptionKekVersion,
    fileEncryptionKeyWrapped: document.fileEncryptionKeyWrapped,
  });

  const { file } = await collectStreamToFile({ fileStream, fileName: document.name, mimeType: document.mimeType });

  const { text } = await extractDocumentText({ file, ocrLanguages });

  const { document: updatedDocument } = await updateDocument({ documentId, organizationId, changes: { content: text }, documentsRepository, eventServices });

  if (isNil(updatedDocument)) {
    // This should never happen, but for type safety
    throw createDocumentNotFoundError();
  }

  await applyTaggingRules({ document: updatedDocument, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

  return { document: updatedDocument };
}

export async function trashDocument({
  documentId,
  organizationId,
  userId,
  documentsRepository,
  eventServices,
}: {
  documentId: string;
  organizationId: string;
  userId: string;
  documentsRepository: DocumentsRepository;
  eventServices: EventServices;
}) {
  await documentsRepository.softDeleteDocument({ documentId, organizationId, userId });

  eventServices.emitEvent({
    eventName: 'document.trashed',
    payload: { documentId, organizationId, trashedBy: userId },
  });
}

export async function restoreDocument({
  documentId,
  organizationId,
  userId,
  documentsRepository,
  eventServices,
}: {
  documentId: string;
  organizationId: string;
  userId: string;
  documentsRepository: DocumentsRepository;
  eventServices: EventServices;
}) {
  await documentsRepository.restoreDocument({ documentId, organizationId });

  eventServices.emitEvent({
    eventName: 'document.restored',
    payload: { documentId, organizationId, restoredBy: userId },
  });
}

export async function updateDocument({
  documentId,
  organizationId,
  userId,
  documentsRepository,
  eventServices,
  changes,
}: {
  documentId: string;
  organizationId: string;
  userId?: string;
  documentsRepository: DocumentsRepository;
  eventServices: EventServices;
  changes: {
    name?: string;
    content?: string;
  };
}) {
  // It throws if the document does not exist
  const { document } = await documentsRepository.updateDocument({ documentId, organizationId, ...changes });

  eventServices.emitEvent({
    eventName: 'document.updated',
    payload: { userId, changes, document },
  });

  return { document };
}
