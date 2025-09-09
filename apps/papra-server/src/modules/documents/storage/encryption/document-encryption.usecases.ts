import type { Logger } from '@crowlog/logger';
import type { Database } from '../../../app/database/database.types';
import type { DocumentStorageService } from '../documents.storage.services';
import { eq, isNull } from 'drizzle-orm';
import { createLogger } from '../../../shared/logger/logger';
import { documentsTable } from '../../documents.table';

export async function encryptAllUnencryptedDocuments({
  db,
  documentStorageService,
  logger = createLogger({ namespace: 'encryptAllUnencryptedDocuments' }),
  deleteUnencryptedAfterEncryption = true,
}: {
  db: Database;
  logger?: Logger;
  documentStorageService: DocumentStorageService;
  deleteUnencryptedAfterEncryption?: boolean;
}) {
  const documents = await db
    .select({
      id: documentsTable.id,
      originalStorageKey: documentsTable.originalStorageKey,
      fileName: documentsTable.originalName,
      mimeType: documentsTable.mimeType,
    })
    .from(documentsTable)
    .where(isNull(documentsTable.fileEncryptionKeyWrapped))
    .orderBy(documentsTable.id);

  logger.info(`Found ${documents.length} documents to encrypt`);

  for (const { id, originalStorageKey, fileName, mimeType } of documents) {
    logger.info(`Encrypting document ${id}`);

    const { fileStream } = await documentStorageService.getFileStream({
      storageKey: originalStorageKey,
      fileEncryptionKeyWrapped: null,
      fileEncryptionAlgorithm: null,
      fileEncryptionKekVersion: null,
    });
    const newStorageKey = `${originalStorageKey}.enc`;
    const { storageKey, ...encryptionFields }
      = await documentStorageService.saveFile({
        fileStream,
        fileName,
        mimeType,
        storageKey: newStorageKey,
      });

    await db
      .update(documentsTable)
      .set({
        ...encryptionFields,
        originalStorageKey: storageKey,
      })
      .where(eq(documentsTable.id, id));

    if (deleteUnencryptedAfterEncryption) {
      await documentStorageService.deleteFile({
        storageKey: originalStorageKey,
      });
    }
  }
}
