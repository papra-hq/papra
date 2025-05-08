import type { EventName, WebhookPayloads } from '@papra/webhooks';
import type { Logger } from '../shared/logger/logger';
import type { WebhookRepository } from './webhook.repository';
import type { Webhook } from './webhooks.types';
import { triggerWebhook as triggerWebhookServiceImpl } from '@papra/webhooks';
import pLimit from 'p-limit';
import { createLogger } from '../shared/logger/logger';
import { createWebhookNotFoundError } from './webhook.errors';

export async function createWebhook({
  name,
  url,
  secret,
  enabled = true,
  events = [],
  organizationId,
  webhookRepository,
  createdBy,
}: {
  name: string;
  url: string;
  secret?: string;
  enabled?: boolean;
  events?: EventName[];
  organizationId: string;
  webhookRepository: WebhookRepository;
  createdBy: string;
}) {
  const { webhook } = await webhookRepository.createOrganizationWebhook({
    name,
    url,
    secret,
    enabled,
    events,
    organizationId,
    createdBy,
  });

  return { webhook };
}

export async function updateWebhook({
  webhookId,
  name,
  url,
  secret,
  enabled,
  events,
  webhookRepository,
  organizationId,
}: {
  webhookId: string;
  name?: string;
  url?: string;
  secret?: string;
  enabled?: boolean;
  events?: EventName[];
  webhookRepository: WebhookRepository;
  organizationId: string;
}) {
  const { webhook: existingWebhook } = await webhookRepository.getOrganizationWebhookById({ webhookId, organizationId });

  if (!existingWebhook) {
    throw createWebhookNotFoundError();
  }

  const { webhook } = await webhookRepository.updateOrganizationWebhook({
    webhookId,
    name,
    url,
    secret,
    enabled,
    events,
    organizationId,
  });

  return { webhook };
}

export async function triggerWebhooks({
  webhookRepository,
  organizationId,
  now = new Date(),
  logger = createLogger({ namespace: 'webhook' }),
  triggerWebhookService = triggerWebhookServiceImpl,
  ...webhookData
}: {
  webhookRepository: WebhookRepository;
  organizationId: string;
  now?: Date;
  logger?: Logger;
  triggerWebhookService?: typeof triggerWebhookServiceImpl;
} & WebhookPayloads) {
  const { event } = webhookData;
  const { webhooks } = await webhookRepository.getOrganizationEnabledWebhooksForEvent({ organizationId, event });

  logger.info({ webhooksCount: webhooks.length, organizationId, event }, 'Triggering webhooks');

  const limit = pLimit(10);

  await Promise.all(
    webhooks.map(webhook =>
      limit(() =>
        triggerWebhook({ webhook, webhookRepository, now, ...webhookData, logger, triggerWebhookService }),
      ),
    ),
  );
}

export async function triggerWebhook({
  webhook,
  webhookRepository,
  now = new Date(),
  logger = createLogger({ namespace: 'webhook' }),
  triggerWebhookService = triggerWebhookServiceImpl,
  ...webhookData
}: {
  webhook: Webhook;
  webhookRepository: WebhookRepository;
  now?: Date;
  logger?: Logger;
  triggerWebhookService?: typeof triggerWebhookServiceImpl;
} & WebhookPayloads) {
  const { url, secret, organizationId } = webhook;
  const { event } = webhookData;

  logger.info({ webhookId: webhook.id, event, organizationId }, 'Triggering webhook');

  const { responseData, responseStatus, requestPayload } = await triggerWebhookService({
    webhookUrl: url,
    webhookSecret: secret,
    now,
    ...webhookData,
  });

  logger.info({ webhookId: webhook.id, event, responseStatus, organizationId }, 'Webhook triggered');

  await webhookRepository.saveWebhookDelivery({
    webhookId: webhook.id,
    eventName: event,
    requestPayload: JSON.stringify(requestPayload),
    responsePayload: JSON.stringify(responseData),
    responseStatus,
  });
}
