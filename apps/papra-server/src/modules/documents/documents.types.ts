import type { Expand } from '@corentinth/chisels';
import type { documentsTable } from './documents.table';

export type DbInsertableDocument = Expand<typeof documentsTable.$inferInsert>;
