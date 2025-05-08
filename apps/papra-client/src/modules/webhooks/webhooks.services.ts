import type { CreateWebhookInput, UpdateWebhookInput, Webhook } from './webhooks.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function createWebhook({ organizationId, ...input }: CreateWebhookInput) {
  const { webhook } = await apiClient<{
    webhook: Webhook;
  }>({
    path: `/api/organizations/${organizationId}/webhooks`,
    method: 'POST',
    body: input,
  });

  return {
    webhook: coerceDates(webhook),
  };
}

export async function fetchWebhooks({ organizationId }: { organizationId: string }) {
  const { webhooks } = await apiClient<{
    webhooks: Webhook[];
  }>({
    path: `/api/organizations/${organizationId}/webhooks`,
  });

  return {
    webhooks: webhooks.map(coerceDates),
  };
}

export async function fetchWebhook({ webhookId, organizationId }: { webhookId: string; organizationId: string }) {
  const { webhook } = await apiClient<{
    webhook: Webhook;
  }>({
    path: `/api/organizations/${organizationId}/webhooks/${webhookId}`,
  });

  return {
    webhook: coerceDates(webhook),
  };
}

export async function updateWebhook({ webhookId, organizationId, input }: { webhookId: string; organizationId: string; input: UpdateWebhookInput }) {
  const { webhook } = await apiClient<{
    webhook: Webhook;
  }>({
    path: `/api/organizations/${organizationId}/webhooks/${webhookId}`,
    method: 'PUT',
    body: input,
  });

  return {
    webhook: coerceDates(webhook),
  };
}

export async function deleteWebhook({ webhookId, organizationId }: { webhookId: string; organizationId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/webhooks/${webhookId}`,
    method: 'DELETE',
  });
}
