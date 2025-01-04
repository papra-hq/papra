import type { Expand } from '@corentinth/chisels';
import type { organizationsTable } from './organizations.table';

export type DbInsertableOrganization = Expand<typeof organizationsTable.$inferInsert>;
