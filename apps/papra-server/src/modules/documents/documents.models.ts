import { getExtension } from '../shared/files/file-names';
import { generateId } from '../shared/random/ids';
import { ORIGINAL_DOCUMENTS_STORAGE_KEY } from './documents.constants';

export function joinStorageKeyParts(...parts: string[]) {
  return parts.join('/');
}

export function buildOriginalDocumentKey({ documentId, organizationId, fileName }: { documentId: string; organizationId: string; fileName: string }) {
  const { extension } = getExtension({ fileName });

  const newFileName = extension ? `${documentId}.${extension}` : documentId;

  const originalDocumentStorageKey = joinStorageKeyParts(organizationId, ORIGINAL_DOCUMENTS_STORAGE_KEY, newFileName);

  return { originalDocumentStorageKey };
}

export function generateDocumentId() {
  return generateId({ prefix: 'doc' });
}

export function isDocumentSizeLimitEnabled({ maxUploadSize }: { maxUploadSize: number }) {
  return maxUploadSize !== 0;
}
