import type { Expand } from '@corentinth/chisels';
import type { tagsTable } from './tags.table';

export type Tag = Expand<typeof tagsTable.$inferSelect>;

export type DbInsertableTag = Expand<typeof tagsTable.$inferInsert>;
