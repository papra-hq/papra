import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';

// --- Tags

export type TagsTable = TableWithIdAndTimestamps<{
  organization_id: string;
  name: string;
  color: string;
  description: string | null;
}>;

export type DbSelectableTag = Selectable<TagsTable>;
export type DbInsertableTag = Insertable<TagsTable>;
export type DbUpdateableTag = Updateable<TagsTable>;

export type InsertableTag = BusinessInsertable<DbInsertableTag, {}>;
export type Tag = Expand<CamelCaseKeys<Omit<DbSelectableTag, 'created_at' | 'updated_at'> & {
  createdAt: Date;
  updatedAt: Date;
}>>;

// --- Documents Tags (Junction Table)

export type DocumentsTagsTable = {
  document_id: string;
  tag_id: string;
};

export type DbSelectableDocumentTag = Selectable<DocumentsTagsTable>;
export type DbInsertableDocumentTag = Insertable<DocumentsTagsTable>;
export type DbUpdateableDocumentTag = Updateable<DocumentsTagsTable>;

export type InsertableDocumentTag = Expand<CamelCaseKeys<DbInsertableDocumentTag>>;
export type DocumentTag = Expand<CamelCaseKeys<DbSelectableDocumentTag>>;
