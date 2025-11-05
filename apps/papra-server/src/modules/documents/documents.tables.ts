import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';

export type DocumentsTable = TableWithIdAndTimestamps<{
  organization_id: string;
  created_by: string | null;

  original_name: string;
  original_size: number;
  original_storage_key: string;
  original_sha256_hash: string;

  name: string;
  mime_type: string;
  content: string;

  file_encryption_key_wrapped: string | null;
  file_encryption_kek_version: string | null;
  file_encryption_algorithm: string | null;

  deleted_at: number | null;
  deleted_by: string | null;
  is_deleted: number;
}>;

export type DbSelectableDocument = Selectable<DocumentsTable>;
export type DbInsertableDocument = Insertable<DocumentsTable>;
export type DbUpdateableDocument = Updateable<DocumentsTable>;

export type InsertableDocument = BusinessInsertable<DbInsertableDocument, {
  isDeleted?: boolean;
  deletedAt?: Date | null;
}>;

export type Document = Expand<CamelCaseKeys<Omit<DbSelectableDocument, 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at'> & {
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
}>>;
