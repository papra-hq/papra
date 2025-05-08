import type { webhookDeliveriesTable, webhookEventsTable, webhooksTable } from './webhooks.tables';

export type Webhook = typeof webhooksTable.$inferSelect;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
export type WebhookDeliveryInsert = typeof webhookDeliveriesTable.$inferInsert;
