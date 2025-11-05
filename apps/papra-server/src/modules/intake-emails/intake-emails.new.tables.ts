import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';

export type IntakeEmailsTable = TableWithIdAndTimestamps<{
  email_address: string;
  organization_id: string;
  allowed_origins: string;
  is_enabled: number;
}>;

export type DbSelectableIntakeEmail = Selectable<IntakeEmailsTable>;
export type DbInsertableIntakeEmail = Insertable<IntakeEmailsTable>;
export type DbUpdateableIntakeEmail = Updateable<IntakeEmailsTable>;

export type InsertableIntakeEmail = BusinessInsertable<DbInsertableIntakeEmail, {
  allowedOrigins?: string[];
  isEnabled?: boolean;
}>;

export type IntakeEmail = Expand<CamelCaseKeys<Omit<DbSelectableIntakeEmail, 'created_at' | 'updated_at' | 'allowed_origins' | 'is_enabled'> & {
  createdAt: Date;
  updatedAt: Date;
  allowedOrigins: string[];
  isEnabled: boolean;
}>>;
