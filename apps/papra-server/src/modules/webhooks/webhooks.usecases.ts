import type { EventName, WebhookPayloads } from '@papra/webhooks';
import type { Logger } from '../shared/logger/logger';
import type { WebhookRepository } from './webhooks.repository';
import type { Webhook, WebhookMultiplePayloads, WebhooksConfig } from './webhooks.types';
import { triggerWebhook as triggerWebhookServiceImpl } from '@papra/webhooks';
import pLimit from 'p-limit';
import { createDeferable } from '../shared/async/defer';
import { createLogger } from '../shared/logger/logger';
import { createCachedIsUrlSsrfSafeFunction, isUrlSsrfSafe } from '../shared/ssrf/ssrf.services';
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
  ...multiplePayloadsData
}: {
  webhookRepository: WebhookRepository;
  organizationId: string;
  now?: Date;
  logger?: Logger;
  triggerWebhookService?: typeof triggerWebhookServiceImpl;
  webhooksConfig: WebhooksConfig;
} & WebhookMultiplePayloads) {
  const { event } = multiplePayloadsData;
  const singlePayloads = splitMultiplePayloads(multiplePayloadsData);

  const { webhooks } = await webhookRepository.getOrganizationEnabledWebhooksForEvent({ organizationId, event });

  logger.info({ webhooksCount: webhooks.length, organizationId, event, payloadsCount: singlePayloads.length }, 'Triggering webhooks');

  const safeWebhooks = await filterOutSsrfUnsafeWebhooks({ webhooks, webhooksConfig, logger });

  const limit = pLimit(10);

  await Promise.all(
    safeWebhooks.flatMap(webhook =>
      singlePayloads.map(async webhookData =>
        limit(async () =>
          triggerWebhook({ webhook, webhookRepository, now, ...webhookData, logger, triggerWebhookService }),
        ),
      ),
    ),
  );
}

async function filterOutSsrfUnsafeWebhooks({
  webhooks,
  webhooksConfig,
  logger,
}: {
  webhooks: Webhook[];
  webhooksConfig: WebhooksConfig;
  logger: Logger;
}): Promise<Webhook[]> {
  if (!webhooksConfig.isSsrfProtectionEnabled) {
    return webhooks;
  }

  const limit = pLimit(10);

  // Caching is done at the function level to limit the TOCTOU window while still avoiding redundant checks for duplicate URLs across webhooks
  const isUrlSsrfSafeCached = createCachedIsUrlSsrfSafeFunction({
    allowedHostnames: webhooksConfig.webhookUrlAllowedHostnames,
    logger,
  });

  const checked = await Promise.all(
    webhooks.map(async webhook =>
      limit(async () => {
        const isSafe = await isUrlSsrfSafeCached({ url: webhook.url });

        if (!isSafe) {
          reportNonSsrfSafeWebhookUrl({ url: webhook.url, logger });
        }

        return { webhook, isSafe };
      }),
    ),
  );

  return checked.filter(({ isSafe }) => isSafe).map(({ webhook }) => webhook);
}

function splitMultiplePayloads(data: WebhookMultiplePayloads): WebhookPayloads[] {
  return data.payloads.map(payload => ({ event: data.event, payload })) as WebhookPayloads[];
}

export const deferTriggerWebhooks = createDeferable(triggerWebhooks);

async function triggerWebhook({
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
