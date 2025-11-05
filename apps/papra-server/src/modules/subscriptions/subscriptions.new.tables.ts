import type { Expand } from '@corentinth/chisels';
import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import type { CamelCaseKeys, WithTimestamps } from '../app/database/database.columns.types';

// Note: This table uses Stripe subscription ID as primary key, not auto-generated
export type OrganizationSubscriptionsTable = WithTimestamps<{
  id: ColumnType<string, string, string>;
  customer_id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  seats_count: number;
  current_period_end: number;
  current_period_start: number;
  cancel_at_period_end: number;
}>;

export type DbSelectableOrganizationSubscription = Selectable<OrganizationSubscriptionsTable>;
export type DbInsertableOrganizationSubscription = Insertable<OrganizationSubscriptionsTable>;
export type DbUpdateableOrganizationSubscription = Updateable<OrganizationSubscriptionsTable>;

export type InsertableOrganizationSubscription = Expand<CamelCaseKeys<Omit<DbInsertableOrganizationSubscription, 'created_at' | 'updated_at' | 'current_period_end' | 'current_period_start' | 'cancel_at_period_end'>> & {
  createdAt?: Date;
  updatedAt?: Date;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  cancelAtPeriodEnd?: boolean;
}>;

export type OrganizationSubscription = Expand<CamelCaseKeys<Omit<DbSelectableOrganizationSubscription, 'created_at' | 'updated_at' | 'current_period_end' | 'current_period_start' | 'cancel_at_period_end'> & {
  createdAt: Date;
  updatedAt: Date;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  cancelAtPeriodEnd: boolean;
}>>;
