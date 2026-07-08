import type { Expand } from '@corentinth/chisels';
import type { foldersTable } from './folders.table';

export type DbInsertableFolder = Expand<typeof foldersTable.$inferInsert>;
export type DbSelectableFolder = Expand<typeof foldersTable.$inferSelect>;

export type Folder = DbSelectableFolder;
