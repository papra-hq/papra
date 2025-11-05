import type { DatabaseClient } from '../app/database/database.types';
import type { DbInsertableDocument, Document } from './documents.tables';
import { injectArguments, safely } from '@corentinth/chisels';
import { subDays } from 'date-fns';
import { sql } from 'kysely';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { createError } from '../shared/errors/errors';
import { isNil, omitUndefined } from '../shared/utils';
import { createDocumentAlreadyExistsError, createDocumentNotFoundError } from './documents.errors';
import { dbToDocument } from './documents.models';

export type DocumentsRepository = ReturnType<typeof createDocumentsRepository>;

export function createDocumentsRepository({ db }: { db: DatabaseClient }) {
  return injectArguments(
    {
      saveOrganizationDocument,
      getOrganizationDocuments,
      getOrganizationDeletedDocuments,
      getDocumentById,
      softDeleteDocument,
      getOrganizationDocumentsCount,
      getOrganizationDeletedDocumentsCount,
      searchOrganizationDocuments,
      restoreDocument,
      hardDeleteDocument,
      getExpiredDeletedDocuments,
      getOrganizationStats,
      getOrganizationDocumentBySha256Hash,
      getAllOrganizationTrashDocuments,
      getAllOrganizationDocuments,
      getAllOrganizationDocumentsIterator,
      getAllOrganizationUndeletedDocumentsIterator,
      updateDocument,
    },
    { db },
  );
}

async function getOrganizationDocumentBySha256Hash({ sha256Hash, organizationId, db }: { sha256Hash: string; organizationId: string; db: DatabaseClient }) {
  const dbDocument = await db
    .selectFrom('documents')
    .where('original_sha256_hash', '=', sha256Hash)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  return { document: dbToDocument(dbDocument) };
}

async function saveOrganizationDocument({ db, ...documentToInsert }: { db: DatabaseClient } & DbInsertableDocument) {
  const [dbDocument, error] = await safely(
    db
      .insertInto('documents')
      .values(documentToInsert)
      .returningAll()
      .executeTakeFirst(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createDocumentAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const document = dbToDocument(dbDocument);

  if (isNil(document)) {
    // Very unlikely to happen as the insertion throws an issue, it's for type safety
    throw createError({
      message: 'Error while saving document',
      code: 'documents.save_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { document };
}

async function getOrganizationDocumentsCount({ organizationId, filters, db }: { organizationId: string; filters?: { tags?: string[] }; db: DatabaseClient }) {
  let query = db
    .selectFrom('documents')
    .select(sql<number>`count(distinct documents.id)`.as('documentsCount'))
    .where('documents.organization_id', '=', organizationId)
    .where('documents.is_deleted', '=', 0);

  if (filters?.tags && filters.tags.length > 0) {
    query = query
      .leftJoin('documents_tags', 'documents.id', 'documents_tags.document_id')
      .where('documents_tags.tag_id', 'in', filters.tags);
  }

  const record = await query.executeTakeFirst();

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount } = record;

  return { documentsCount };
}

async function getOrganizationDeletedDocumentsCount({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const record = await db
    .selectFrom('documents')
    .select(sql<number>`count(*)`.as('documentsCount'))
    .where('organization_id', '=', organizationId)
    .where('is_deleted', '=', 1)
    .executeTakeFirst();

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount } = record;

  return { documentsCount };
}

async function getOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
  filters,
  db,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  filters?: { tags?: string[] };
  db: DatabaseClient;
}) {
  let query = db
    .selectFrom('documents')
    .leftJoin('documents_tags', 'documents.id', 'documents_tags.document_id')
    .leftJoin('tags', 'tags.id', 'documents_tags.tag_id')
    .where('documents.organization_id', '=', organizationId)
    .where('documents.is_deleted', '=', 0);

  if (filters?.tags && filters.tags.length > 0) {
    query = query.where('documents_tags.tag_id', 'in', filters.tags);
  }

  const documentsTags = await query
    .select([
      'documents.id',
      'documents.organization_id',
      'documents.created_by',
      'documents.original_name',
      'documents.original_size',
      'documents.original_storage_key',
      'documents.original_sha256_hash',
      'documents.name',
      'documents.mime_type',
      'documents.file_encryption_key_wrapped',
      'documents.file_encryption_kek_version',
      'documents.file_encryption_algorithm',
      'documents.deleted_at',
      'documents.deleted_by',
      'documents.is_deleted',
      'documents.created_at',
      'documents.updated_at',
      'tags.id as tag_id',
      'tags.organization_id as tag_organization_id',
      'tags.name as tag_name',
      'tags.color as tag_color',
      'tags.description as tag_description',
      'tags.created_at as tag_created_at',
      'tags.updated_at as tag_updated_at',
    ])
    .orderBy('documents.created_at', 'desc')
    .limit(pageSize)
    .offset(pageIndex * pageSize)
    .execute();

  const groupedDocuments = documentsTags.reduce((acc, row) => {
    if (!acc[row.id]) {
      const dbDoc = {
        id: row.id,
        organization_id: row.organization_id,
        created_by: row.created_by,
        original_name: row.original_name,
        original_size: row.original_size,
        original_storage_key: row.original_storage_key,
        original_sha256_hash: row.original_sha256_hash,
        name: row.name,
        mime_type: row.mime_type,
        content: '', // Not selected in this query
        file_encryption_key_wrapped: row.file_encryption_key_wrapped,
        file_encryption_kek_version: row.file_encryption_kek_version,
        file_encryption_algorithm: row.file_encryption_algorithm,
        deleted_at: row.deleted_at,
        deleted_by: row.deleted_by,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      const document = dbToDocument(dbDoc);
      if (document) {
        acc[row.id] = {
          ...document,
          tags: [],
        };
      }
    }

    if (row.tag_id && acc[row.id]) {
      acc[row.id]!.tags.push({
        id: row.tag_id,
        organization_id: row.tag_organization_id!,
        name: row.tag_name!,
        color: row.tag_color!,
        description: row.tag_description!,
        created_at: row.tag_created_at!,
        updated_at: row.tag_updated_at!,
      });
    }

    return acc;
  }, {} as Record<string, Document & { tags: any[] }>);

  return {
    documents: Object.values(groupedDocuments),
  };
}

async function getOrganizationDeletedDocuments({ organizationId, pageIndex, pageSize, db }: { organizationId: string; pageIndex: number; pageSize: number; db: DatabaseClient }) {
  const dbDocuments = await db
    .selectFrom('documents')
    .where('organization_id', '=', organizationId)
    .where('is_deleted', '=', 1)
    .selectAll()
    .orderBy('deleted_at', 'desc')
    .limit(pageSize)
    .offset(pageIndex * pageSize)
    .execute();

  return {
    documents: dbDocuments.map(dbDoc => dbToDocument(dbDoc)).filter((doc): doc is NonNullable<typeof doc> => doc !== undefined),
  };
}

async function getDocumentById({ documentId, organizationId, db }: { documentId: string; organizationId: string; db: DatabaseClient }) {
  const dbDocument = await db
    .selectFrom('documents')
    .where('id', '=', documentId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  const document = dbToDocument(dbDocument);

  if (!document) {
    return { document: undefined };
  }

  const tags = await db
    .selectFrom('documents_tags')
    .leftJoin('tags', 'tags.id', 'documents_tags.tag_id')
    .where('documents_tags.document_id', '=', documentId)
    .select([
      'tags.id',
      'tags.organization_id',
      'tags.name',
      'tags.color',
      'tags.description',
      'tags.created_at',
      'tags.updated_at',
    ])
    .execute();

  return {
    document: {
      ...document,
      tags,
    },
  };
}

async function softDeleteDocument({ documentId, organizationId, userId, db, now = new Date() }: { documentId: string; organizationId: string; userId: string; db: DatabaseClient; now?: Date }) {
  await db
    .updateTable('documents')
    .set({
      is_deleted: 1,
      deleted_by: userId,
      deleted_at: now.getTime(),
    })
    .where('id', '=', documentId)
    .where('organization_id', '=', organizationId)
    .execute();
}

async function restoreDocument({ documentId, organizationId, name, userId, db }: { documentId: string; organizationId: string; name?: string; userId?: string; db: DatabaseClient }) {
  const dbDocument = await db
    .updateTable('documents')
    .set(omitUndefined({
      is_deleted: 0,
      deleted_by: null,
      deleted_at: null,
      name,
      original_name: name,
      created_by: userId,
    }))
    .where('id', '=', documentId)
    .where('organization_id', '=', organizationId)
    .returningAll()
    .executeTakeFirst();

  const document = dbToDocument(dbDocument);

  if (isNil(document)) {
    throw createDocumentNotFoundError();
  }

  return { document };
}

async function hardDeleteDocument({ documentId, db }: { documentId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('documents')
    .where('id', '=', documentId)
    .execute();
}

async function getExpiredDeletedDocuments({ db, expirationDelayInDays, now = new Date() }: { db: DatabaseClient; expirationDelayInDays: number; now?: Date }) {
  const expirationDate = subDays(now, expirationDelayInDays);

  const documents = await db
    .selectFrom('documents')
    .select(['id', 'original_storage_key as originalStorageKey'])
    .where('is_deleted', '=', 1)
    .where('deleted_at', '<', expirationDate.getTime())
    .execute();

  return {
    documents,
  };
}

async function searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize, db }: { organizationId: string; searchQuery: string; pageIndex: number; pageSize: number; db: DatabaseClient }) {
  // TODO: extract this logic to a tested function
  // when searchquery is a single word, we append a wildcard to it to make it a prefix search
  const cleanedSearchQuery = searchQuery.replace(/"/g, '').replace(/\*/g, '').trim();
  const formattedSearchQuery = cleanedSearchQuery.includes(' ') ? cleanedSearchQuery : `${cleanedSearchQuery}*`;

  const result = await sql`
    SELECT * FROM documents
    JOIN documents_fts ON documents_fts.id = documents.id
    WHERE documents.organization_id = ${organizationId}
          AND documents.is_deleted = 0
          AND documents_fts MATCH ${formattedSearchQuery}
    ORDER BY rank
    LIMIT ${pageSize}
    OFFSET ${pageIndex * pageSize}
  `.execute(db);

  return {
    documents: (result.rows as any[]).map(row => dbToDocument(row)).filter((doc): doc is NonNullable<typeof doc> => doc !== undefined),
  };
}

async function getOrganizationStats({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const record = await db
    .selectFrom('documents')
    .select([
      sql<number>`COUNT(id)`.as('totalDocumentsCount'),
      sql<number>`COALESCE(SUM(original_size), 0)`.as('totalDocumentsSize'),
      sql<number>`COUNT(id) FILTER (WHERE is_deleted = 1)`.as('deletedDocumentsCount'),
      sql<number>`COUNT(id) FILTER (WHERE is_deleted = 0)`.as('documentsCount'),
      sql<number>`COALESCE(SUM(original_size) FILTER (WHERE is_deleted = 0), 0)`.as('documentsSize'),
      sql<number>`COALESCE(SUM(original_size) FILTER (WHERE is_deleted = 1), 0)`.as('deletedDocumentsSize'),
    ])
    .where('organization_id', '=', organizationId)
    .executeTakeFirst();

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount, documentsSize, deletedDocumentsCount, deletedDocumentsSize, totalDocumentsCount, totalDocumentsSize } = record;

  return {
    documentsCount,
    documentsSize: Number(documentsSize ?? 0),
    deletedDocumentsCount,
    deletedDocumentsSize: Number(deletedDocumentsSize ?? 0),
    totalDocumentsCount,
    totalDocumentsSize: Number(totalDocumentsSize ?? 0),
  };
}

async function getAllOrganizationTrashDocuments({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const documents = await db
    .selectFrom('documents')
    .select(['id', 'original_storage_key as originalStorageKey'])
    .where('organization_id', '=', organizationId)
    .where('is_deleted', '=', 1)
    .execute();

  return {
    documents,
  };
}

async function getAllOrganizationDocuments({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const documents = await db
    .selectFrom('documents')
    .select(['id', 'original_storage_key as originalStorageKey'])
    .where('organization_id', '=', organizationId)
    .execute();

  return {
    documents,
  };
}

async function* getAllOrganizationDocumentsIterator({ organizationId, batchSize = 100, db }: { organizationId: string; batchSize?: number; db: DatabaseClient }): AsyncGenerator<{ id: string; originalStorageKey: string }> {
  let offset = 0;

  while (true) {
    const results = await db
      .selectFrom('documents')
      .select(['id', 'original_storage_key as originalStorageKey'])
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'asc')
      .limit(batchSize)
      .offset(offset)
      .execute();

    if (results.length === 0) {
      break;
    }

    for (const result of results) {
      yield result;
    }

    if (results.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}

async function* getAllOrganizationUndeletedDocumentsIterator({ organizationId, batchSize = 100, db }: { organizationId: string; batchSize?: number; db: DatabaseClient }) {
  let offset = 0;

  while (true) {
    const dbResults = await db
      .selectFrom('documents')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('is_deleted', '=', 0)
      .orderBy('created_at', 'asc')
      .limit(batchSize)
      .offset(offset)
      .execute();

    if (dbResults.length === 0) {
      break;
    }

    for (const dbResult of dbResults) {
      const document = dbToDocument(dbResult);
      if (document) {
        yield document;
      }
    }

    if (dbResults.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}

async function updateDocument({ documentId, organizationId, name, content, db }: { documentId: string; organizationId: string; name?: string; content?: string; db: DatabaseClient }) {
  const dbDocument = await db
    .updateTable('documents')
    .set(omitUndefined({ name, content }))
    .where('id', '=', documentId)
    .where('organization_id', '=', organizationId)
    .returningAll()
    .executeTakeFirst();

  const document = dbToDocument(dbDocument);

  if (isNil(document)) {
    // This should never happen, but for type safety
    throw createDocumentNotFoundError();
  }

  return { document };
}
