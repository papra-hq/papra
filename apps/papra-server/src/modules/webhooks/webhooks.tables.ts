import type { Expand } from '@corentinth/chisels';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps, TimestampsToDate } from '../app/database/database.columns.types';

// --- Webhooks

export type WebhooksTable = TableWithIdAndTimestamps<{
  name: string;
  url: string;
  secret: string | null;
  enabled: number;
  created_by: string | null;
  organization_id: string;
}>;

export type DbSelectableWebhook = Selectable<WebhooksTable>;
export type DbInsertableWebhook = Insertable<WebhooksTable>;
export type DbUpdatableWebhook = Updateable<WebhooksTable>;

export type InsertableWebhook = BusinessInsertable<DbInsertableWebhook, {
  enabled?: boolean;
}>;
export type Webhook = Expand<CamelCaseKeys<Omit<TimestampsToDate<DbSelectableWebhook>, 'enabled'> & { enabled: boolean }>>;

// --- Webhook Events

export type WebhookEventsTable = TableWithIdAndTimestamps<{
  webhook_id: string;
  event_name: string;
}>;

export type DbSelectableWebhookEvent = Selectable<WebhookEventsTable>;
export type DbInsertableWebhookEvent = Insertable<WebhookEventsTable>;
export type DbUpdatableWebhookEvent = Updateable<WebhookEventsTable>;

export type InsertableWebhookEvent = BusinessInsertable<DbInsertableWebhookEvent, {}>;
export type WebhookEvent = Expand<CamelCaseKeys<TimestampsToDate<DbSelectableWebhookEvent>>>;

// --- Webhook Deliveries

export type WebhookDeliveriesTable = TableWithIdAndTimestamps<{
  webhook_id: string;
  event_name: string;
  request_payload: string;
  response_payload: string;
  response_status: number;
}>;

export type DbSelectableWebhookDelivery = Selectable<WebhookDeliveriesTable>;
export type DbInsertableWebhookDelivery = Insertable<WebhookDeliveriesTable>;
export type DbUpdatableWebhookDelivery = Updateable<WebhookDeliveriesTable>;

export type InsertableWebhookDelivery = BusinessInsertable<DbInsertableWebhookDelivery, {}>;
export type WebhookDelivery = Expand<CamelCaseKeys<TimestampsToDate<DbSelectableWebhookDelivery>>>;
