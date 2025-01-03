import type { Expand } from '@corentinth/chisels';
import type { usersTable } from './users.table';

export type User = Expand<typeof usersTable.$inferSelect>;

export type DbInsertableUser = Expand<typeof usersTable.$inferInsert>;
