import type { PartialBy } from '@corentinth/chisels';
import type { DbInsertableDocument, DbSelectableDocument, Document, InsertableDocument } from './documents.tables';
import { omit } from 'lodash-es';
import { getExtension } from '../shared/files/file-names';
import { generateId } from '../shared/random/ids';
import { isDefined, isNil } from '../shared/utils';
import { ORIGINAL_DOCUMENTS_STORAGE_KEY } from './documents.constants';

export function joinStorageKeyParts(...parts: string[]) {
  return parts.join('/');
}

export function buildOriginalDocumentKey({ documentId, organizationId, fileName }: { documentId: string; organizationId: string; fileName: string }) {
  const { extension } = getExtension({ fileName });

  const newFileName = isDefined(extension) ? `${documentId}.${extension}` : documentId;

  const originalDocumentStorageKey = joinStorageKeyParts(organizationId, ORIGINAL_DOCUMENTS_STORAGE_KEY, newFileName);

  return { originalDocumentStorageKey };
}

export function generateDocumentId() {
  return generateId({ prefix: 'doc' });
}

export function isDocumentSizeLimitEnabled({ maxUploadSize }: { maxUploadSize: number }) {
  return maxUploadSize > 0;
}

export function formatDocumentForApi<T extends PartialBy<Document, 'content'>>({ document }: { document: T }) {
  return {
    ...omit(
      document,
      [
        'fileEncryptionAlgorithm',
        'fileEncryptionKeyWrapped',
        'fileEncryptionKekVersion',
        'originalStorageKey',
      ],
    ),
  };
}

export function formatDocumentsForApi<T extends PartialBy<Document, 'content'>>({ documents }: { documents: T[] }) {
  return documents.map(document => formatDocumentForApi({ document }));
}

// DB <-> Business model transformers

export function dbToDocument(dbDocument?: DbSelectableDocument): Document | undefined {
  if (!dbDocument) {
    return undefined;
  }

  return {
    id: dbDocument.id,
    organizationId: dbDocument.organization_id,
    createdBy: dbDocument.created_by,
    originalName: dbDocument.original_name,
    originalSize: dbDocument.original_size,
    originalStorageKey: dbDocument.original_storage_key,
    originalSha256Hash: dbDocument.original_sha256_hash,
    name: dbDocument.name,
    mimeType: dbDocument.mime_type,
    content: dbDocument.content,
    fileEncryptionKeyWrapped: dbDocument.file_encryption_key_wrapped,
    fileEncryptionKekVersion: dbDocument.file_encryption_kek_version,
    fileEncryptionAlgorithm: dbDocument.file_encryption_algorithm,
    deletedBy: dbDocument.deleted_by,
    isDeleted: dbDocument.is_deleted === 1,
    createdAt: new Date(dbDocument.created_at),
    updatedAt: new Date(dbDocument.updated_at),
    deletedAt: isNil(dbDocument.deleted_at) ? null : new Date(dbDocument.deleted_at),
  };
}

export function documentToDb(
  document: InsertableDocument,
  {
    now = new Date(),
    generateId: generateIdFn = generateDocumentId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableDocument {
  return {
    id: document.id ?? generateIdFn(),
    organization_id: document.organizationId,
    created_by: document.createdBy,
    original_name: document.originalName,
    original_size: document.originalSize,
    original_storage_key: document.originalStorageKey,
    original_sha256_hash: document.originalSha256Hash,
    name: document.name,
    mime_type: document.mimeType,
    content: document.content,
    file_encryption_key_wrapped: document.fileEncryptionKeyWrapped,
    file_encryption_kek_version: document.fileEncryptionKekVersion,
    file_encryption_algorithm: document.fileEncryptionAlgorithm,
    deleted_by: document.deletedBy,
    deleted_at: document.deletedAt?.getTime(),
    is_deleted: document.isDeleted === true ? 1 : 0,
    created_at: document.createdAt?.getTime() ?? now.getTime(),
    updated_at: document.updatedAt?.getTime() ?? now.getTime(),
  };
}
