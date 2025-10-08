import type { Database } from '../app/database/database.types';
import type { DbInsertableTag } from './tags.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { get } from 'lodash-es';
import { documentsTable } from '../documents/documents.table';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/utils';
import { createDocumentAlreadyHasTagError, createTagAlreadyExistsError } from './tags.errors';
import { documentsTagsTable, tagsTable } from './tags.table';

export type TagsRepository = ReturnType<typeof createTagsRepository>;

export function createTagsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationTags,
      getTagById,
      createTag,
      deleteTag,
      updateTag,
      addTagToDocument,
      addTagsToDocument,
      removeTagFromDocument,
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
    .groupBy(tagsTable.id);

  return { tags };
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

async function createTag({ tag, db }: { tag: DbInsertableTag; db: Database }) {
  const [result, error] = await safely(db.insert(tagsTable).values(tag).returning());

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
  const [tag] = await db
    .update(tagsTable)
    .set(
      omitUndefined({
        name,
        description,
        color,
      }),
    )
    .where(
      eq(tagsTable.id, tagId),
    )
    .returning();

  return { tag };
}

async function addTagToDocument({ tagId, documentId, db }: { tagId: string; documentId: string; db: Database }) {
  const [_, error] = await safely(db.insert(documentsTagsTable).values({ tagId, documentId }));

  if (error && get(error, 'code') === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
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
