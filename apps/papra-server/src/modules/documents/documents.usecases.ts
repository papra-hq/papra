import type { DocumentsRepository } from './documents.repository';
import type { DocumentStorageService } from './storage/documents.storage.services';

export async function createDocument({
  file,
  userId,
  organizationId,
  documentsRepository,
  documentsStorageService,
}: {
  file: File;
  userId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  const { storageKey } = await documentsStorageService.saveFile({
    file,
    organizationId,
  });

  const {
    name: fileName,
    size,
    type: mimeType,
  } = file;

  const { document } = await documentsRepository.saveOrganizationDocument({
    name: fileName,
    organizationId,
    originalName: fileName,
    createdBy: userId,
    size,
    storageKey,
    mimeType,
  });

  return { document };
}
