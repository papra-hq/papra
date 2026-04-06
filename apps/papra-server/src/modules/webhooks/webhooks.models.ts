import type { Webhook } from './webhooks.types';
import { omit } from '../shared/objects';

export function formatWebhookForApi<T extends Webhook>(webhook: T) {
  return omit(webhook, ['secret']);
}
