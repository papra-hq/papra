import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';

export type UserRolesTable = TableWithIdAndTimestamps<{
  user_id: string;
  role: string;
}>;

export type DbSelectableUserRole = Selectable<UserRolesTable>;
export type DbInsertableUserRole = Insertable<UserRolesTable>;
export type DbUpdateableUserRole = Updateable<UserRolesTable>;

export type InsertableUserRole = BusinessInsertable<DbInsertableUserRole, {}>;
export type UserRole = Expand<CamelCaseKeys<Omit<DbSelectableUserRole, 'created_at' | 'updated_at'> & {
  createdAt: Date;
  updatedAt: Date;
}>>;
