import type { Database } from '../app/database/database.types';
import type { Tag } from './tags.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, count, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { documentsTable } from '../documents/documents.table';
import { chunkArray } from '../shared/arrays/arrays.utils';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/objects';
import { isDefined } from '../shared/utils';
import { createDocumentAlreadyHasTagError, createTagAlreadyExistsError } from './tags.errors';
import { normalizeTagName } from './tags.repository.models';
import { documentsTagsTable, tagsTable } from './tags.table';

export type TagsRepository = ReturnType<typeof createTagsRepository>;

export function createTagsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationTags,
      getOrganizationTagsCount,
      getTagById,
      getTagsByIds,
      getTagsByDocumentIds,
      createTag,
      deleteTag,
      updateTag,
      addTagToDocument,
      addTagsToDocument,
      addTagsToDocumentsBatch,
      removeTagFromDocument,
      removeTagsFromDocumentsBatch,
      removeAllTagsFromDocument,
    },
    { db },
  );
}

async function getOrganizationTags({ organizationId, db }: { organizationId: string; db: Database }) {
  const tags = await db
    .select({
      ...getTableColumns(tagsTable),
      documentsCount: sql<number>`COUNT(${documentsTagsTable.documentId}) FILTER (WHERE ${documentsTable.isDeleted} = false)`.as('documentsCount'),
    })
    .from(tagsTable)
    .leftJoin(documentsTagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
    .leftJoin(documentsTable, eq(documentsTagsTable.documentId, documentsTable.id))
    .where(eq(tagsTable.organizationId, organizationId))
    .groupBy(tagsTable.id)
    .orderBy(desc(tagsTable.createdAt));

  return { tags };
}

async function getOrganizationTagsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [result] = await db
    .select({ tagsCount: count() })
    .from(tagsTable)
    .where(eq(tagsTable.organizationId, organizationId));

  return { tagsCount: result?.tagsCount ?? 0 };
}

async function getTagsByDocumentIds({ documentIds, db }: { documentIds: string[]; db: Database }): Promise<{ tagsByDocumentId: Record<string, Tag[]> }> {
  if (documentIds.length === 0) {
    return { tagsByDocumentId: {} };
  }

  const rows = await db
    .select({
      documentId: documentsTagsTable.documentId,
      ...getTableColumns(tagsTable),
    })
    .from(documentsTagsTable)
    .innerJoin(tagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
    .where(inArray(documentsTagsTable.documentId, documentIds));

  const tagsByDocumentId: Record<string, Tag[]> = {};

  for (const { documentId, ...tag } of rows) {
    (tagsByDocumentId[documentId] ??= []).push(tag);
  }

  return { tagsByDocumentId };
}

async function getTagById({ tagId, organizationId, db }: { tagId: string; organizationId: string; db: Database }) {
  const [tag] = await db
    .select()
    .from(tagsTable)
    .where(
      and(
        eq(tagsTable.id, tagId),
        eq(tagsTable.organizationId, organizationId),
      ),
    );

  return { tag };
}

async function getTagsByIds({ tagIds, organizationId, db }: { tagIds: string[]; organizationId: string; db: Database }) {
  if (tagIds.length === 0) {
    return { tags: [] as Tag[] };
  }

  const tags = await db
    .select()
    .from(tagsTable)
    .where(
      and(
        inArray(tagsTable.id, tagIds),
        eq(tagsTable.organizationId, organizationId),
      ),
    );

  return { tags };
}

async function createTag({ tag, db }: { tag: { name: string; description?: string | null; color: string; organizationId: string }; db: Database }) {
  const [result, error] = await safely(
    db
      .insert(tagsTable)
      .values({
        ...tag,
        normalizedName: normalizeTagName({ name: tag.name }),
      })
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createTagAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [createdTag] = result;

  return { tag: createdTag };
}

async function deleteTag({ tagId, db }: { tagId: string; db: Database }) {
  await db.delete(tagsTable).where(eq(tagsTable.id, tagId));
}

async function updateTag({ tagId, name, description, color, db }: { tagId: string; name?: string; description?: string; color?: string; db: Database }) {
  const [result, error] = await safely(
    db
      .update(tagsTable)
      .set(
        omitUndefined({
          name,
          description,
          color,
          normalizedName: isDefined(name) ? normalizeTagName({ name }) : undefined,
        }),
      )
      .where(
        eq(tagsTable.id, tagId),
      )
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createTagAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [tag] = result;

  return { tag };
}

async function addTagToDocument({ tagId, documentId, db }: { tagId: string; documentId: string; db: Database }) {
  const [_, error] = await safely(db.insert(documentsTagsTable).values({ tagId, documentId }));

  if (error && isUniqueConstraintError({ error })) {
    throw createDocumentAlreadyHasTagError();
  }

  if (error) {
    throw error;
  }
}

async function addTagsToDocument({ tagIds, documentId, db }: { tagIds: string[]; documentId: string; db: Database }) {
  await db.insert(documentsTagsTable).values(tagIds.map(tagId => ({ tagId, documentId })));
}

async function removeTagFromDocument({ tagId, documentId, db }: { tagId: string; documentId: string; db: Database }) {
  await db.delete(documentsTagsTable).where(
    and(
      eq(documentsTagsTable.tagId, tagId),
      eq(documentsTagsTable.documentId, documentId),
    ),
  );
}

async function removeAllTagsFromDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db.delete(documentsTagsTable).where(eq(documentsTagsTable.documentId, documentId));
}

// Each (documentId, tagId) row uses 2 SQLite host parameters; chunk so a single statement
// stays well under the 32766 default host-parameter cap.
const DOCUMENTS_TAGS_PAIR_CHUNK_SIZE = 500;
const DOCUMENTS_TAGS_DELETE_DOC_CHUNK_SIZE = 500;

async function addTagsToDocumentsBatch({
  documentIds,
  tagIds,
  db,
}: {
  documentIds: string[];
  tagIds: string[];
  db: Database;
}): Promise<{ insertedPairs: { documentId: string; tagId: string }[] }> {
  if (documentIds.length === 0 || tagIds.length === 0) {
    return { insertedPairs: [] };
  }

  // The max tag number per document is expected to be low (50 limited by batch api endpoint)
  // so the cartesian product is acceptable to be stored in memory
  const allPairs = documentIds.flatMap(documentId => tagIds.map(tagId => ({ documentId, tagId })));

  const insertedPairs: { documentId: string; tagId: string }[] = [];

  for (const chunk of chunkArray(allPairs, DOCUMENTS_TAGS_PAIR_CHUNK_SIZE)) {
    const rows = await db
      .insert(documentsTagsTable)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ documentId: documentsTagsTable.documentId, tagId: documentsTagsTable.tagId });

    insertedPairs.push(...rows);
  }

  return { insertedPairs };
}

async function removeTagsFromDocumentsBatch({
  documentIds,
  tagIds,
  db,
}: {
  documentIds: string[];
  tagIds: string[];
  db: Database;
}): Promise<{ removedPairs: { documentId: string; tagId: string }[] }> {
  if (documentIds.length === 0 || tagIds.length === 0) {
    return { removedPairs: [] };
  }

  const removedPairs: { documentId: string; tagId: string }[] = [];

  for (const docChunk of chunkArray(documentIds, DOCUMENTS_TAGS_DELETE_DOC_CHUNK_SIZE)) {
    const rows = await db
      .delete(documentsTagsTable)
      .where(
        and(
          inArray(documentsTagsTable.documentId, docChunk),
          inArray(documentsTagsTable.tagId, tagIds),
        ),
      )
      .returning({ documentId: documentsTagsTable.documentId, tagId: documentsTagsTable.tagId });

    removedPairs.push(...rows);
  }

  return { removedPairs };
}
