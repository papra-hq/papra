import type { Expand } from '@corentinth/chisels';
import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys } from '../app/database/database.columns.types';

export type UsersTable = {
  id: ColumnType<string, string, never>;
  email: string;
  email_verified: ColumnType<number, number | undefined, number>;
  name: string | null;
  image: string | null;
  max_organization_count: number | null;

  created_at: ColumnType<number, number, never>;
  updated_at: ColumnType<number, number, number>;
};

export type DbSelectableUser = Selectable<UsersTable>;
export type DbInsertableUser = Insertable<UsersTable>;
export type DbUpdatableUser = Updateable<UsersTable>;

export type InsertableUser = BusinessInsertable<DbInsertableUser, { emailVerified?: boolean }>;

export type User = Expand<CamelCaseKeys<Omit<DbSelectableUser, 'email_verified' | 'created_at' | 'updated_at'> & {
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}>>;
