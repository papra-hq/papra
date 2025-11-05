import type { DbInsertableDocumentTag, DbInsertableTag, DbSelectableDocumentTag, DbSelectableTag, DocumentTag, InsertableDocumentTag, InsertableTag, Tag } from './tags.tables';
import { generateId } from '../shared/random/ids';
import { tagIdPrefix } from './tags.constants';

const generateTagId = () => generateId({ prefix: tagIdPrefix });

export function dbToTag(dbTag?: DbSelectableTag): Tag | undefined {
  if (!dbTag) {
    return undefined;
  }

  return {
    id: dbTag.id,
    organizationId: dbTag.organization_id,
    name: dbTag.name,
    color: dbTag.color,
    description: dbTag.description,
    createdAt: new Date(dbTag.created_at),
    updatedAt: new Date(dbTag.updated_at),
  };
}

export function tagToDb(
  tag: InsertableTag,
  {
    now = new Date(),
    generateId = generateTagId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableTag {
  return {
    id: tag.id ?? generateId(),
    organization_id: tag.organizationId,
    name: tag.name,
    color: tag.color,
    description: tag.description,
    created_at: tag.createdAt?.getTime() ?? now.getTime(),
    updated_at: tag.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Documents Tags junction table transformers

export function dbToDocumentTag(dbDocumentTag?: DbSelectableDocumentTag): DocumentTag | undefined {
  if (!dbDocumentTag) {
    return undefined;
  }

  return {
    documentId: dbDocumentTag.document_id,
    tagId: dbDocumentTag.tag_id,
  };
}

export function documentTagToDb(documentTag: InsertableDocumentTag): DbInsertableDocumentTag {
  return {
    document_id: documentTag.documentId,
    tag_id: documentTag.tagId,
  };
}
