import type { EventName, WebhookPayloads } from '@papra/webhooks';
import type { Logger } from '../shared/logger/logger';
import type { WebhookRepository } from './webhooks.repository';
import type { Webhook, WebhooksConfig } from './webhooks.types';
import { triggerWebhook as triggerWebhookServiceImpl } from '@papra/webhooks';
import pLimit from 'p-limit';
import { createDeferable } from '../shared/async/defer';
import { createLogger } from '../shared/logger/logger';
import { isUrlSsrfSafe } from '../shared/ssrf/ssrf.services';
import { WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR } from './webhooks.constants';
import { createSsrfUnsafeUrlError, createWebhookNotFoundError } from './webhooks.errors';

export async function createWebhook({
  name,
  url,
  secret,
  enabled = true,
  events = [],
  organizationId,
  webhookRepository,
  createdBy,
  webhooksConfig,
}: {
  name: string;
  url: string;
  secret?: string;
  enabled?: boolean;
  events?: EventName[];
  organizationId: string;
  webhookRepository: WebhookRepository;
  createdBy: string;
  webhooksConfig: WebhooksConfig;
}) {
  await checkWebhookUrlIsSsrfSafe({
    url,
    isSsrfProtectionEnabled: webhooksConfig.isSsrfProtectionEnabled,
    allowedHostnames: webhooksConfig.webhookUrlAllowedHostnames,
  });

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
  webhooksConfig,
}: {
  webhookId: string;
  name?: string;
  url?: string;
  secret?: string;
  enabled?: boolean;
  events?: EventName[];
  webhookRepository: WebhookRepository;
  organizationId: string;
  webhooksConfig: WebhooksConfig;
}) {
  const { webhook: existingWebhook } = await webhookRepository.getOrganizationWebhookById({ webhookId, organizationId });

  if (!existingWebhook) {
    throw createWebhookNotFoundError();
  }

  if (url !== undefined) {
    await checkWebhookUrlIsSsrfSafe({
      url,
      isSsrfProtectionEnabled: webhooksConfig.isSsrfProtectionEnabled,
      allowedHostnames: webhooksConfig.webhookUrlAllowedHostnames,
    });
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
  webhooksConfig,
  ...webhookData
}: {
  webhookRepository: WebhookRepository;
  organizationId: string;
  now?: Date;
  logger?: Logger;
  triggerWebhookService?: typeof triggerWebhookServiceImpl;
  webhooksConfig: WebhooksConfig;
} & WebhookPayloads) {
  const { event } = webhookData;
  const { webhooks } = await webhookRepository.getOrganizationEnabledWebhooksForEvent({ organizationId, event });

  logger.info({ webhooksCount: webhooks.length, organizationId, event }, 'Triggering webhooks');

  const limit = pLimit(10);

  await Promise.all(
    webhooks.map(async webhook =>
      limit(async () =>
        triggerWebhook({ webhook, webhookRepository, now, ...webhookData, logger, triggerWebhookService, webhooksConfig }),
      ),
    ),
  );
}

export const deferTriggerWebhooks = createDeferable(triggerWebhooks);

export async function triggerWebhook({
  webhook,
  webhookRepository,
  now = new Date(),
  logger = createLogger({ namespace: 'webhook' }),
  triggerWebhookService = triggerWebhookServiceImpl,
  webhooksConfig,
  ...webhookData
}: {
  webhook: Webhook;
  webhookRepository: WebhookRepository;
  now?: Date;
  logger?: Logger;
  triggerWebhookService?: typeof triggerWebhookServiceImpl;
  webhooksConfig: WebhooksConfig;
} & WebhookPayloads) {
  const { url, secret, organizationId } = webhook;
  const { event } = webhookData;

  // Check SSRF safety of the webhook URL before triggering the webhook
  // still vulnerable to TOCTOU dns rebinbing attacks, but the timing window is really small
  // and needs the attacker to have access to dns. It's currently an acceptable risk
  await checkWebhookUrlIsSsrfSafe({
    url,
    isSsrfProtectionEnabled: webhooksConfig.isSsrfProtectionEnabled,
    allowedHostnames: webhooksConfig.webhookUrlAllowedHostnames,
    logger,
  });

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

function reportNonSsrfSafeWebhookUrl({ url, logger }: { url: string; logger: Logger }) {
  try {
    const { hostname } = new URL(url);
    logger.warn({ hostname }, `Webhook URL is not SSRF safe, if the hostname (${hostname}) is expected to be SSRF safe, consider adding it to the allowed hostnames list in the configuration (${WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR}=${hostname})`);
  } catch {
    logger.error('Webhook URL is not SSRF safe and is also an invalid URL');
  }
}

export async function checkWebhookUrlIsSsrfSafe({
  url,
  isSsrfProtectionEnabled,
  allowedHostnames,
  logger = createLogger({ namespace: 'webhook' }),
}: {
  url: string;
  isSsrfProtectionEnabled: boolean;
  allowedHostnames: Set<string>;
  logger?: Logger;
}) {
  if (!isSsrfProtectionEnabled) {
    return;
  }

  const isSafe = await isUrlSsrfSafe({ url, allowedHostnames });

  if (!isSafe) {
    reportNonSsrfSafeWebhookUrl({ url, logger });
    throw createSsrfUnsafeUrlError();
  }
}
