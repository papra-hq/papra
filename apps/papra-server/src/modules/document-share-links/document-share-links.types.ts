import type { Expand } from '@corentinth/chisels';
import type { documentShareLinksTable } from './document-share-links.table';

export type DbInsertableShareLink = Expand<typeof documentShareLinksTable.$inferInsert>;
export type DbSelectableShareLink = Expand<typeof documentShareLinksTable.$inferSelect>;

export type ShareLink = DbSelectableShareLink;
