import { documentsTable } from "../documents.table";
import { DocumentStorageService } from "./documents.storage.services";

export async function migrateDocumentsStorage({db, inputDocumentStorageService, outputDocumentStorageService, logger = createLogger({ namespace: 'migrateDocumentsStorage' })}: {
  db: Database;
  inputDocumentStorageService: DocumentStorageService;
  outputDocumentStorageService: DocumentStorageService;
  logger?: Logger;
}) {


}