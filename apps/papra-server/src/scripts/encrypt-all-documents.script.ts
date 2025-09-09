import process from 'node:process';
import { isNull } from 'drizzle-orm';
import { documentsTable } from '../modules/documents/documents.table';
import { createDocumentStorageService } from '../modules/documents/storage/documents.storage.services';
import { encryptAllUnencryptedDocuments } from '../modules/documents/storage/encryption/document-encryption.usecases';
import { isNil } from '../modules/shared/utils';
import { runScriptWithDb } from './commons/run-script';

await runScriptWithDb(
  { scriptName: 'encrypt-all-documents' },
  async ({ db, config, logger, isDryRun }) => {
    const documentStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

    if (!config.documentsStorage.encryption.isEncryptionEnabled) {
      logger.error('Document encryption is not enabled, skipping');

      process.exit(1);
    }

    if (isNil(config.documentsStorage.encryption.documentKeyEncryptionKeys)) {
      logger.error('Document encryption keys are not set, skipping');

      process.exit(1);
    }

    logger.info('Starting encryption of all unencrypted documents');

    if (isDryRun) {
      logger.info('[DRY RUN] No actual encryption will be performed');

      // In dry run mode, just count the documents that would be encrypted
      const documents = await db
        .select({ id: documentsTable.id, originalName: documentsTable.originalName })
        .from(documentsTable)
        .where(isNull(documentsTable.fileEncryptionKeyWrapped));

      logger.info({
        count: documents.length,
        documents: documents.map(d => ({ id: d.id, name: d.originalName })),
      }, '[DRY RUN] Documents that would be encrypted');

      return;
    }

    await encryptAllUnencryptedDocuments({
      db,
      documentStorageService,
      logger,
      deleteUnencryptedAfterEncryption: true,
    });

    logger.info('Document encryption completed successfully');
  },
);
