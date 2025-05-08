import type { WEBHOOK_EVENT_NAMES } from './webhooks.constants';

export type WebhookEvent = (typeof WEBHOOK_EVENT_NAMES)[number];

export type Webhook = {
  id: string;
  name: string;
  url: string;
  secret?: string;
  enabled: boolean;
  events: WebhookEvent[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  lastError?: string;
};

export type CreateWebhookInput = {
  name: string;
  url: string;
  secret?: string;
  enabled?: boolean;
  events?: WebhookEvent[];
  organizationId: string;
};

export type UpdateWebhookInput = {
  name?: string;
  url?: string;
  secret?: string;
  enabled?: boolean;
  events?: WebhookEvent[];
};
