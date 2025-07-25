import type { EventName } from './webhooks.constants';

export type WebhookPayload<T extends EventName, D extends Record<string, unknown>> = { event: T; payload: D };

export type DocumentCreatedPayload = WebhookPayload<
  'document:created',
  {
    documentId: string;
    organizationId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
>;

export type DocumentDeletedPayload = WebhookPayload<
  'document:deleted',
  {
    documentId: string;
    organizationId: string;
  }
>;

export type WebhookPayloads = DocumentCreatedPayload | DocumentDeletedPayload;

type ExtractEventName<T> = T extends WebhookPayload<infer E, any> ? E : never;
export type BuildStandardWebhookEventPayload<T extends WebhookPayloads> = { type: T['event']; timestamp: string; data: T['payload'] };
export type BuildWebhookEvents<T extends WebhookPayloads> = {
  [K in ExtractEventName<T>]: (args: BuildStandardWebhookEventPayload<Extract<T, WebhookPayload<K, any>>>) => void;
};

export type WebhookEvents = BuildWebhookEvents<WebhookPayloads>;

export type StandardWebhookEventPayload = BuildStandardWebhookEventPayload<WebhookPayloads>;
