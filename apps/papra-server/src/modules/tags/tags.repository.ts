import type { DatabaseClient } from '../app/database/database.types';
import type { InsertableTag, InsertableDocumentTag } from './tags.tables';
import { injectArguments, safely } from '@corentinth/chisels';
import { sql } from 'kysely';
import { get } from 'lodash-es';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/utils';
import { createDocumentAlreadyHasTagError, createTagAlreadyExistsError } from './tags.errors';
import { dbToTag, tagToDb } from './tags.models';

export type TagsRepository = ReturnType<typeof createTagsRepository>;

export function createTagsRepository({ db }: { db: DatabaseClient }) {
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

async function getOrganizationTags({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const dbTags = await db
    .selectFrom('tags')
    .leftJoin('documents_tags', 'tags.id', 'documents_tags.tag_id')
    .leftJoin('documents', 'documents_tags.document_id', 'documents.id')
    .where('tags.organization_id', '=', organizationId)
    .select([
      'tags.id',
      'tags.organization_id',
      'tags.name',
      'tags.color',
      'tags.description',
      'tags.created_at',
      'tags.updated_at',
      sql<number>`COUNT(documents_tags.document_id) FILTER (WHERE documents.is_deleted = 0)`.as('documentsCount'),
    ])
    .groupBy('tags.id')
    .execute();

  const tags = dbTags
    .map((dbTag) => {
      const { documentsCount, ...dbTagData } = dbTag;
      const tag = dbToTag(dbTagData);
      if (!tag) {
        return undefined;
      }
      return {
        ...tag,
        documentsCount,
      };
    })
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);

  return { tags };
}

async function getTagById({ tagId, organizationId, db }: { tagId: string; organizationId: string; db: DatabaseClient }) {
  const dbTag = await db
    .selectFrom('tags')
    .where('id', '=', tagId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  return { tag: dbToTag(dbTag) };
}

async function createTag({ tag, db }: { tag: InsertableTag; db: DatabaseClient }) {
  const [dbTag, error] = await safely(
    db
      .insertInto('tags')
      .values(tagToDb(tag))
      .returningAll()
      .executeTakeFirst(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createTagAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  return { tag: dbToTag(dbTag) };
}

async function deleteTag({ tagId, db }: { tagId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('tags')
    .where('id', '=', tagId)
    .execute();
}

async function updateTag({ tagId, name, description, color, db }: { tagId: string; name?: string; description?: string; color?: string; db: DatabaseClient }) {
  const dbTag = await db
    .updateTable('tags')
    .set(
      omitUndefined({
        name,
        description,
        color,
      }),
    )
    .where('id', '=', tagId)
    .returningAll()
    .executeTakeFirst();

  return { tag: dbToTag(dbTag) };
}

async function addTagToDocument({ tagId, documentId, db }: { tagId: string; documentId: string; db: DatabaseClient }) {
  const [_, error] = await safely(
    db
      .insertInto('documents_tags')
      .values({ tag_id: tagId, document_id: documentId })
      .execute(),
  );

  if (error && get(error, 'code') === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    throw createDocumentAlreadyHasTagError();
  }

  if (error) {
    throw error;
  }
}

async function addTagsToDocument({ tagIds, documentId, db }: { tagIds: string[]; documentId: string; db: DatabaseClient }) {
  await db
    .insertInto('documents_tags')
    .values(tagIds.map(tagId => ({ tag_id: tagId, document_id: documentId })))
    .execute();
}

async function removeTagFromDocument({ tagId, documentId, db }: { tagId: string; documentId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('documents_tags')
    .where('tag_id', '=', tagId)
    .where('document_id', '=', documentId)
    .execute();
}

async function removeAllTagsFromDocument({ documentId, db }: { documentId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('documents_tags')
    .where('document_id', '=', documentId)
    .execute();
}
