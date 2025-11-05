import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../database/database.columns.types';

// --- Auth Sessions

export type AuthSessionsTable = TableWithIdAndTimestamps<{
  token: string;
  user_id: string | null;
  expires_at: number;
  ip_address: string | null;
  user_agent: string | null;
  active_organization_id: string | null;
}>;

export type DbSelectableAuthSession = Selectable<AuthSessionsTable>;
export type DbInsertableAuthSession = Insertable<AuthSessionsTable>;
export type DbUpdateableAuthSession = Updateable<AuthSessionsTable>;

export type InsertableAuthSession = BusinessInsertable<DbInsertableAuthSession, {
  expiresAt: Date;
}>;

export type AuthSession = Expand<CamelCaseKeys<Omit<DbSelectableAuthSession, 'created_at' | 'updated_at' | 'expires_at'> & {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}>>;

// --- Auth Accounts

export type AuthAccountsTable = TableWithIdAndTimestamps<{
  user_id: string | null;
  account_id: string;
  provider_id: string;
  access_token: string | null;
  refresh_token: string | null;
  access_token_expires_at: number | null;
  refresh_token_expires_at: number | null;
  scope: string | null;
  id_token: string | null;
  password: string | null;
}>;

export type DbSelectableAuthAccount = Selectable<AuthAccountsTable>;
export type DbInsertableAuthAccount = Insertable<AuthAccountsTable>;
export type DbUpdateableAuthAccount = Updateable<AuthAccountsTable>;

export type InsertableAuthAccount = BusinessInsertable<DbInsertableAuthAccount, {
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
}>;

export type AuthAccount = Expand<CamelCaseKeys<Omit<DbSelectableAuthAccount, 'created_at' | 'updated_at' | 'access_token_expires_at' | 'refresh_token_expires_at'> & {
  createdAt: Date;
  updatedAt: Date;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
}>>;

// --- Auth Verifications

export type AuthVerificationsTable = TableWithIdAndTimestamps<{
  identifier: string;
  value: string;
  expires_at: number;
}>;

export type DbSelectableAuthVerification = Selectable<AuthVerificationsTable>;
export type DbInsertableAuthVerification = Insertable<AuthVerificationsTable>;
export type DbUpdateableAuthVerification = Updateable<AuthVerificationsTable>;

export type InsertableAuthVerification = BusinessInsertable<DbInsertableAuthVerification, {
  expiresAt: Date;
}>;

export type AuthVerification = Expand<CamelCaseKeys<Omit<DbSelectableAuthVerification, 'created_at' | 'updated_at' | 'expires_at'> & {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}>>;
