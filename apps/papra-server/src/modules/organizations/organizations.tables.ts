import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';

// --- Organizations

export type OrganizationsTable = TableWithIdAndTimestamps<{
  name: string;
  customer_id: string | null;
  deleted_at: number | null;
  deleted_by: string | null;
  scheduled_purge_at: number | null;
}>;

export type DbSelectableOrganization = Selectable<OrganizationsTable>;
export type DbInsertableOrganization = Insertable<OrganizationsTable>;
export type DbUpdateableOrganization = Updateable<OrganizationsTable>;

export type InsertableOrganization = BusinessInsertable<DbInsertableOrganization, {
  deletedAt?: Date | null;
  scheduledPurgeAt?: Date | null;
}>;
export type Organization = Expand<CamelCaseKeys<Omit<DbSelectableOrganization, 'created_at' | 'updated_at' | 'deleted_at' | 'scheduled_purge_at'> & {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  scheduledPurgeAt: Date | null;
}>>;

// --- Organization Members

export type OrganizationMembersTable = TableWithIdAndTimestamps<{
  organization_id: string;
  user_id: string;
  role: string;
}>;

export type DbSelectableOrganizationMember = Selectable<OrganizationMembersTable>;
export type DbInsertableOrganizationMember = Insertable<OrganizationMembersTable>;
export type DbUpdateableOrganizationMember = Updateable<OrganizationMembersTable>;

export type InsertableOrganizationMember = BusinessInsertable<DbInsertableOrganizationMember, {}>;
export type OrganizationMember = Expand<CamelCaseKeys<Omit<DbSelectableOrganizationMember, 'created_at' | 'updated_at' | 'role'> & {
  createdAt: Date;
  updatedAt: Date;
  role: 'owner' | 'admin' | 'member';
}>>;

// --- Organization Invitations

export type OrganizationInvitationsTable = TableWithIdAndTimestamps<{
  organization_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: number;
  inviter_id: string;
}>;

export type DbSelectableOrganizationInvitation = Selectable<OrganizationInvitationsTable>;
export type DbInsertableOrganizationInvitation = Insertable<OrganizationInvitationsTable>;
export type DbUpdateableOrganizationInvitation = Updateable<OrganizationInvitationsTable>;

export type InsertableOrganizationInvitation = BusinessInsertable<DbInsertableOrganizationInvitation, {
  expiresAt: Date;
}>;
export type OrganizationInvitation = Expand<CamelCaseKeys<Omit<DbSelectableOrganizationInvitation, 'created_at' | 'updated_at' | 'expires_at' | 'role' | 'status'> & {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
}>>;
