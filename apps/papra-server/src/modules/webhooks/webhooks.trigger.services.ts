import type { WebhookRepository } from './webhook.repository';
import type { WebhooksConfig } from './webhooks.types';
import { injectArguments } from '@corentinth/chisels';
import { deferTriggerWebhooks, triggerWebhooks } from './webhook.usecases';

export type WebhookTriggerServices = ReturnType<typeof createWebhookTriggerServices>;

export function createWebhookTriggerServices({
  webhooksConfig,
  webhookRepository,
}: {
  webhooksConfig: WebhooksConfig;
  webhookRepository: WebhookRepository;
}) {
  return injectArguments({
    triggerWebhooks,
    deferTriggerWebhooks,
  }, {
    webhooksConfig,
    webhookRepository,
  });
}
