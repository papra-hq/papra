import type { Config } from '../config/config.types';
import type { Logger } from '../shared/logger/logger';
import type { DocumentsRepository } from './documents.repository';
import type { DocumentStorageService } from './storage/documents.storage.services';
import { safely } from '@corentinth/chisels';
import { extractTextFromFile } from '@papra/lecture';
import { createLogger } from '../shared/logger/logger';
import { createDocumentNotFoundError } from './documents.errors';
import { buildOriginalDocumentKey, generateDocumentId as generateDocumentIdImpl } from './documents.models';

const logger = createLogger({ namespace: 'documents:usecases' });

export async function extractDocumentText({ file }: { file: File }) {
  const { textContent, error, extractorName } = await extractTextFromFile({ file });

  if (error) {
    logger.error({ error, extractorName }, 'Error while attempting to extract text from PDF');
  }

  return {
    text: textContent ?? '',
  };
}

export async function createDocument({
  file,
  userId,
  organizationId,
  documentsRepository,
  documentsStorageService,
  generateDocumentId = generateDocumentIdImpl,
}: {
  file: File;
  userId?: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  generateDocumentId?: () => string;
}) {
  const {
    name: fileName,
    size,
    type: mimeType,
  } = file;

  const documentId = generateDocumentId();

  const { originalDocumentStorageKey } = buildOriginalDocumentKey({
    documentId,
    organizationId,
    fileName,
  });

  const { storageKey } = await documentsStorageService.saveFile({
    file,
    storageKey: originalDocumentStorageKey,
  });

  const { text } = await extractDocumentText({ file });

  const { document } = await documentsRepository.saveOrganizationDocument({
    id: documentId,
    name: fileName,
    organizationId,
    originalName: fileName,
    createdBy: userId,
    originalSize: size,
    originalStorageKey: storageKey,
    mimeType,
    content: text,
  });

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
  documentId,
  documentsRepository,
  documentsStorageService,
}: {
  documentId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  await Promise.all([
    documentsRepository.hardDeleteDocument({ documentId }),
    documentsStorageService.deleteFile({ storageKey: documentId }),
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
  const { documentIds } = await documentsRepository.getExpiredDeletedDocuments({
    expirationDelayInDays: config.documents.deletedDocumentsRetentionDays,
    now,
  });

  await Promise.all(
    documentIds.map(async (documentId) => {
      const [, error] = await safely(hardDeleteDocument({ documentId, documentsRepository, documentsStorageService }));

      if (error) {
        logger.error({ documentId, error }, 'Error while deleting expired document');
      }
    }),
  );

  return {
    deletedDocumentsCount: documentIds.length,
  };
}
