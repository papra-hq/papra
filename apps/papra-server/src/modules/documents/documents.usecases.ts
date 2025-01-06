import type { DocumentsRepository } from './documents.repository';
import type { DocumentStorageService } from './storage/documents.storage.services';
import { buildOriginalDocumentKey, generateDocumentId as generateDocumentIdImpl } from './documents.models';

export async function createDocument({
  file,
  userId,
  organizationId,
  documentsRepository,
  documentsStorageService,
  generateDocumentId = generateDocumentIdImpl,
}: {
  file: File;
  userId: string;
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

  const { document } = await documentsRepository.saveOrganizationDocument({
    id: documentId,
    name: fileName,
    organizationId,
    originalName: fileName,
    createdBy: userId,
    originalSize: size,
    originalStorageKey: storageKey,
    mimeType,
  });

  return { document };
}
