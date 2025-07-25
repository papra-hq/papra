import type { StandardWebhookEventPayload, WebhookPayloads } from './webhooks.types';

export function serializeBody<T extends WebhookPayloads>({ now = new Date(), payload, event }: { now?: Date; payload: T['payload']; event: T['event'] }) {
  const body: StandardWebhookEventPayload = {
    data: payload,
    type: event,
    timestamp: now.toISOString(),
  };

  return JSON.stringify(body);
}

export function parseBody(body: string) {
  return JSON.parse(body) as StandardWebhookEventPayload;
}
