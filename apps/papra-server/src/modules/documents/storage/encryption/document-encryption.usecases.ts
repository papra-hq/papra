import type { Logger } from '@crowlog/logger';
import type { DatabaseClient } from '../../../app/database/database.types';
import type { DocumentStorageService } from '../documents.storage.services';
import { createLogger } from '../../../shared/logger/logger';

export async function encryptAllUnencryptedDocuments({
  db,
  documentStorageService,
  logger = createLogger({ namespace: 'encryptAllUnencryptedDocuments' }),
  deleteUnencryptedAfterEncryption = true,
}: {
  db: DatabaseClient;
  logger?: Logger;
  documentStorageService: DocumentStorageService;
  deleteUnencryptedAfterEncryption?: boolean;
}) {
  const documents = await db
    .selectFrom('documents')
    .select([
      'id',
      'original_storage_key',
      'original_name',
      'mime_type',
    ])
    .where('file_encryption_key_wrapped', 'is', null)
    .orderBy('id')
    .execute();

  logger.info(`Found ${documents.length} documents to encrypt`);

  for (const doc of documents) {
    logger.info(`Encrypting document ${doc.id}`);

    const { fileStream } = await documentStorageService.getFileStream({
      storageKey: doc.original_storage_key,
      fileEncryptionKeyWrapped: null,
      fileEncryptionAlgorithm: null,
      fileEncryptionKekVersion: null,
    });
    const newStorageKey = `${doc.original_storage_key}.enc`;
    const { storageKey, ...encryptionFields }
      = await documentStorageService.saveFile({
        fileStream,
        fileName: doc.original_name,
        mimeType: doc.mime_type,
        storageKey: newStorageKey,
      });

    await db
      .updateTable('documents')
      .set({
        ...encryptionFields,
        original_storage_key: storageKey,
      })
      .where('id', '=', doc.id)
      .execute();

    if (deleteUnencryptedAfterEncryption) {
      await documentStorageService.deleteFile({
        storageKey: doc.original_storage_key,
      });
    }
  }
}
