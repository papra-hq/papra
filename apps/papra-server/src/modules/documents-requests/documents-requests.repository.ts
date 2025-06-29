import type { Database } from '../app/database/database.types';

import type { DocumentsRequestAccessLevel } from './documents-requests.types';
import { randomBytes } from 'node:crypto';
import { injectArguments } from '@corentinth/chisels';
import { generateId } from '../shared/random/ids';
import { DOCUMENTS_REQUESTS_FILES_ID_PREFIX, DOCUMENTS_REQUESTS_ID_PREFIX } from './documents-requests.constants';
import { documentsRequestsFilesTable, documentsRequestsFileTagsTable, documentsRequestsTable } from './documents-requests.tables';

export function createDocumentsRequestsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createDocumentsRequest,
    },
    {
      db,
    },
  );
}

async function createDocumentsRequest({
  documentsRequest,
  files,
  db,
}: {
  documentsRequest: {
    token: string;
    organizationId: string;
    createdBy: string | null;
    title: string;
    description?: string;
    useLimit?: number;
    expiresAt?: Date;
    accessLevel: DocumentsRequestAccessLevel;
    isEnabled?: boolean;
  };
  files: {
    title: string;
    description?: string;
    allowedMimeTypes: string[];
    sizeLimit?: number;
    tags: string[];
  }[];
  db: Database;
}) {

  const [createdDocumentsRequest] = await db
    .insert(documentsRequestsTable)
    .values(documentsRequest)
    .returning();

  for (const file of files) {
    const [createdFile] = await db
      .insert(documentsRequestsFilesTable)
      .values({
        documentsRequestId: createdDocumentsRequest.id,
        title: file.title,
        description: file.description,
        allowedMimeTypes: file.allowedMimeTypes,
        sizeLimit: file.sizeLimit,
      })
      .returning();

    for (const tag of file.tags) {
      await db
        .insert(documentsRequestsFileTagsTable)
        .values({
          documentsRequestId: createdDocumentsRequest.id,
          fileId: createdFile.id,
          tagId: tag,
        });
    }
  }

  return { documentsRequest: createdDocumentsRequest };
}
