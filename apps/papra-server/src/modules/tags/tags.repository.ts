import type { Database } from '../app/database/database.types';
import type { DbInsertableTag } from './tags.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, count, eq, getTableColumns } from 'drizzle-orm';
import { get } from 'lodash-es';
import { omitUndefined } from '../shared/utils';
import { createDocumentAlreadyHasTagError } from './tags.errors';
import { documentsTagsTable, tagsTable } from './tags.table';

export type TagsRepository = ReturnType<typeof createTagsRepository>;

export function createTagsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationTags,
      createTag,
      deleteTag,
      updateTag,
      addTagToDocument,
      addTagsToDocument,
      removeTagFromDocument,
    },
    { db },
  );
}

async function getOrganizationTags({ organizationId, db }: { organizationId: string; db: Database }) {
  const tags = await db
    .select({
      ...getTableColumns(tagsTable),
      documentsCount: count(documentsTagsTable.documentId),
    })
    .from(tagsTable)
    .leftJoin(documentsTagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
    .where(
      eq(tagsTable.organizationId, organizationId),
    )
    .groupBy(tagsTable.id);

  return { tags };
}

async function createTag({ tag, db }: { tag: DbInsertableTag; db: Database }) {
  const [createdTag] = await db.insert(tagsTable).values(tag).returning();

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
