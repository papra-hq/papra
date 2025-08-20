import type { Readable } from 'node:stream';
import type { Database } from '../app/database/database.types';
import type { Config } from '../config/config.types';
import type { PlansRepository } from '../plans/plans.repository';
import type { Logger } from '../shared/logger/logger';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { TaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import type { TagsRepository } from '../tags/tags.repository';
import type { TaskServices } from '../tasks/tasks.services';
import type { TrackingServices } from '../tracking/tracking.services';
import type { WebhookRepository } from '../webhooks/webhook.repository';
import type { DocumentActivityRepository } from './document-activity/document-activity.repository';
import type { DocumentsRepository } from './documents.repository';
import type { Document } from './documents.types';
import type { DocumentStorageService } from './storage/documents.storage.services';
import { safely } from '@corentinth/chisels';
import pLimit from 'p-limit';
import { createOrganizationDocumentStorageLimitReachedError } from '../organizations/organizations.errors';
import { getOrganizationStorageLimits } from '../organizations/organizations.usecases';
import { createPlansRepository } from '../plans/plans.repository';
import { createLogger } from '../shared/logger/logger';
import { createByteCounter } from '../shared/streams/byte-counter';
import { createSha256HashTransformer } from '../shared/streams/stream-hash';
import { collectStreamToFile } from '../shared/streams/stream.convertion';
import { isDefined } from '../shared/utils';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createTaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import { applyTaggingRules } from '../tagging-rules/tagging-rules.usecases';
import { createTagsRepository } from '../tags/tags.repository';
import { createTrackingServices } from '../tracking/tracking.services';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { deferTriggerWebhooks } from '../webhooks/webhook.usecases';
import { createDocumentActivityRepository } from './document-activity/document-activity.repository';
import { deferRegisterDocumentActivityLog } from './document-activity/document-activity.usecases';
import { createDocumentAlreadyExistsError, createDocumentNotDeletedError, createDocumentNotFoundError, createDocumentSizeTooLargeError } from './documents.errors';
import { buildOriginalDocumentKey, generateDocumentId as generateDocumentIdImpl } from './documents.models';
import { createDocumentsRepository } from './documents.repository';
import { extractDocumentText } from './documents.services';

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
  trackingServices,
  taggingRulesRepository,
  tagsRepository,
  webhookRepository,
  documentActivityRepository,
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
  trackingServices: TrackingServices;
  taggingRulesRepository: TaggingRulesRepository;
  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
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

  const outputStream = fileStream
    .pipe(hashStream)
    .pipe(byteCountStream);

  // We optimistically save the file to leverage streaming, if the file already exists, we will delete it
  await documentsStorageService.saveFile({
    fileStream: outputStream,
    storageKey: originalDocumentStorageKey,
    mimeType,
    fileName,
  });

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
        newDocumentStorageKey: originalDocumentStorageKey,
        tagsRepository,
        taggingRulesRepository,
        documentsStorageService,
        logger,
      })
    : await createNewDocument({
        newDocumentStorageKey: originalDocumentStorageKey,
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
        trackingServices,
        taskServices,
        ocrLanguages,
        logger,
      });

  deferRegisterDocumentActivityLog({
    documentId: document.id,
    event: 'created',
    userId,
    documentActivityRepository,
  });

  deferTriggerWebhooks({
    webhookRepository,
    organizationId,
    event: 'document:created',
    payload: {
      documentId: document.id,
      organizationId,
      name: document.name,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    },
  });

  return { document };
}

export type CreateDocumentUsecase = Awaited<ReturnType<typeof createDocumentCreationUsecase>>;
export type DocumentUsecaseDependencies = Omit<Parameters<typeof createDocument>[0], 'fileStream' | 'fileName' | 'mimeType' | 'userId' | 'organizationId'>;

export async function createDocumentCreationUsecase({
  db,
  config,
  taskServices,
  documentsStorageService,
  ...initialDeps
}: {
  db: Database;
  taskServices: TaskServices;
  documentsStorageService: DocumentStorageService;
  config: Config;
} & Partial<DocumentUsecaseDependencies>) {
  const deps = {
    documentsRepository: initialDeps.documentsRepository ?? createDocumentsRepository({ db }),
    plansRepository: initialDeps.plansRepository ?? createPlansRepository({ config }),
    subscriptionsRepository: initialDeps.subscriptionsRepository ?? createSubscriptionsRepository({ db }),
    trackingServices: initialDeps.trackingServices ?? createTrackingServices({ config }),
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
  }) => createDocument({ taskServices, documentsStorageService, ...args, ...deps });
}

async function handleExistingDocument({
  existingDocument,
  fileName,
  userId,
  organizationId,
  documentsRepository,
  tagsRepository,
  taggingRulesRepository,
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
  documentsStorageService: DocumentStorageService;
  newDocumentStorageKey: string;
  logger: Logger;
}) {
  if (!existingDocument.isDeleted) {
    await documentsStorageService.deleteFile({ storageKey: newDocumentStorageKey });

    throw createDocumentAlreadyExistsError();
  }

  logger.info({ documentId: existingDocument.id }, 'Document already exists, restoring for deduplication');

  const [, { document: restoredDocument }] = await Promise.all([
    tagsRepository.removeAllTagsFromDocument({ documentId: existingDocument.id }),
    documentsRepository.restoreDocument({ documentId: existingDocument.id, organizationId, name: fileName, userId }),
  ]);

  await applyTaggingRules({ document: restoredDocument, taggingRulesRepository, tagsRepository });

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
  newDocumentStorageKey,
  documentId,
  trackingServices,
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
  trackingServices: TrackingServices;
  newDocumentStorageKey: string;
  taskServices: TaskServices;
  ocrLanguages?: string[];
  logger: Logger;
}) {
  // TODO: wrap in a transaction

  // Recheck for quota after saving the file to the storage
  const { availableDocumentStorageBytes } = await getOrganizationStorageLimits({ organizationId, plansRepository, subscriptionsRepository, documentsRepository });

  if (size > availableDocumentStorageBytes) {
    logger.error({ size, availableDocumentStorageBytes }, 'Document size exceeds organization storage limit after being saved');
    await documentsStorageService.deleteFile({ storageKey: newDocumentStorageKey });

    throw createOrganizationDocumentStorageLimitReachedError();
  }

  const [result, error] = await safely(documentsRepository.saveOrganizationDocument({
    id: documentId,
    name: fileName,
    organizationId,
    originalName: fileName,
    createdBy: userId,
    originalSize: size,
    originalStorageKey: newDocumentStorageKey,
    mimeType,
    originalSha256Hash: hash,
  }));

  if (error) {
    logger.error({ error }, 'Error while creating document');

    // If the document is not saved, delete the file from the storage
    await documentsStorageService.deleteFile({ storageKey: newDocumentStorageKey });

    logger.error({ error }, 'Stored document file deleted because of error');

    throw error;
  }

  await taskServices.scheduleJob({
    taskName: 'extract-document-file-content',
    data: { documentId, organizationId, ocrLanguages },
  });

  if (isDefined(userId)) {
    trackingServices.captureUserEvent({ userId, event: 'Document created' });
  }

  logger.info({ documentId, userId, organizationId }, 'Document created');

  return { document: result.document };
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
}: {
  document: Pick<Document, 'id' | 'originalStorageKey'>;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  await Promise.all([
    documentsRepository.hardDeleteDocument({ documentId: document.id }),
    documentsStorageService.deleteFile({ storageKey: document.originalStorageKey }),
  ]);
}

export async function deleteExpiredDocuments({
  documentsRepository,
  documentsStorageService,
  config,
  now = new Date(),
  logger = createLogger({ namespace: 'documents:deleteExpiredDocuments' }),
}: {
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
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
      const [, error] = await safely(hardDeleteDocument({ document, documentsRepository, documentsStorageService }));

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
}: {
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  if (!document.isDeleted) {
    throw createDocumentNotDeletedError();
  }

  await hardDeleteDocument({ document, documentsRepository, documentsStorageService });
}

export async function deleteAllTrashDocuments({
  organizationId,
  documentsRepository,
  documentsStorageService,
}: {
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  const { documents } = await documentsRepository.getAllOrganizationTrashDocuments({ organizationId });

  // TODO: refactor to use batching and transaction

  const limit = pLimit(10);

  await Promise.all(
    documents.map(async document => limit(async () => hardDeleteDocument({ document, documentsRepository, documentsStorageService }))),
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
}: {
  documentId: string;
  ocrLanguages?: string[];
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  taggingRulesRepository: TaggingRulesRepository;
  tagsRepository: TagsRepository;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  const { fileStream } = await documentsStorageService.getFileStream({ storageKey: document.originalStorageKey });

  const { file } = await collectStreamToFile({ fileStream, fileName: document.name, mimeType: document.mimeType });

  const { text } = await extractDocumentText({ file, ocrLanguages });

  const { document: updatedDocument } = await documentsRepository.updateDocument({ documentId, organizationId, content: text });

  if (!updatedDocument) {
    // This should never happen, but for type safety
    throw createDocumentNotFoundError();
  }

  await applyTaggingRules({ document: updatedDocument, taggingRulesRepository, tagsRepository });

  return { document: updatedDocument };
}
