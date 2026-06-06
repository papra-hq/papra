import type { WebhookRepository } from './webhooks.repository';
import type { WebhooksConfig } from './webhooks.types';
import { injectArguments } from '@corentinth/chisels';
import { createWebhookHttpClient } from './webhooks.http-client';
import { deferTriggerWebhooks, triggerWebhooks } from './webhooks.usecases';

export type WebhookTriggerServices = ReturnType<typeof createWebhookTriggerServices>;

export function createWebhookTriggerServices({
  webhooksConfig,
  webhookRepository,
}: {
  webhooksConfig: WebhooksConfig;
  webhookRepository: WebhookRepository;
}) {
  const httpClient = createWebhookHttpClient({
    isSsrfProtectionEnabled: webhooksConfig.isSsrfProtectionEnabled,
    allowedHostnames: webhooksConfig.webhookUrlAllowedHostnames,
  });

  return injectArguments({
    triggerWebhooks,
    deferTriggerWebhooks,
  }, {
    webhookRepository,
    httpClient,
  });
}
