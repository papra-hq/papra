import type { WebhookEventPayload, WebhookPayloads } from './webhooks.types';

export function serializeBody({ now = new Date(), ...payload }: { now?: Date } & WebhookPayloads) {
  const body: WebhookEventPayload = {
    ...payload,
    timestampMs: now.getTime(),
  };

  return JSON.stringify(body);
}

export function parseBody(body: string) {
  return JSON.parse(body) as WebhookEventPayload;
}
