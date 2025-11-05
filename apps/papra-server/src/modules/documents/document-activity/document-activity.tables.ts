import type { Expand } from '@corentinth/chisels';
import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import type { CamelCaseKeys } from '../../app/database/database.columns.types';

export type DocumentActivityLogTable = {
  id: ColumnType<string, string, never>;
  created_at: number;

  document_id: string;
  event: string;
  event_data: string | null;
  user_id: string | null;
  tag_id: string | null;
};

export type DbSelectableDocumentActivity = Selectable<DocumentActivityLogTable>;
export type DbInsertableDocumentActivity = Insertable<DocumentActivityLogTable>;
export type DbUpdateableDocumentActivity = Updateable<DocumentActivityLogTable>;

export type InsertableDocumentActivity = Expand<CamelCaseKeys<Omit<DbInsertableDocumentActivity, 'id' | 'created_at' | 'event_data'>> & {
  id?: string;
  createdAt?: Date;
  eventData?: Record<string, unknown> | null;
}>;
export type DocumentActivity = Expand<CamelCaseKeys<Omit<DbSelectableDocumentActivity, 'created_at' | 'event_data'> & {
  createdAt: Date;
  eventData: Record<string, unknown> | null;
}>>;
