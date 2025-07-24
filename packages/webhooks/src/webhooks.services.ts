import type { WebhookPayloads } from './webhooks.types';
import { createId } from '@paralleldrive/cuid2';
import { ofetch } from 'ofetch';
import { signBody } from './signature';
import { serializeBody } from './webhooks.models';

export async function webhookHttpClient({
  url,
  ...options
}: {
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
}) {
  const response = await ofetch.raw<unknown>(url, {
    ...options,
    ignoreResponseError: true,
  });

  return {
    responseStatus: response.status,
    responseData: response._data,
  };
}

export async function triggerWebhook<T extends WebhookPayloads>({
  webhookUrl,
  webhookSecret,
  httpClient = webhookHttpClient,
  now = new Date(),
  payload,
  event,
  webhookId = `msg_${createId()}`,
}: {
  webhookUrl: string;
  webhookSecret?: string | null;
  httpClient?: typeof webhookHttpClient;
  payload: T['payload'];
  now?: Date;
  event: T['event'];
  webhookId?: string;
}) {
  const timestamp = Math.floor(now.getTime() / 1000).toString();

  const headers: Record<string, string> = {
    'user-agent': 'papra-webhook-client',
    'content-type': 'application/json',
    'webhook-id': webhookId,
    'webhook-timestamp': timestamp,
  };

  const body = serializeBody({ event, payload, now });

  if (webhookSecret) {
    const { signature } = await signBody({ serializedPayload: body, webhookId, timestamp, secret: webhookSecret });
    headers['webhook-signature'] = signature;
  }

  const { responseData, responseStatus } = await httpClient({
    url: webhookUrl,
    method: 'POST',
    body,
    headers,
  });

  return {
    responseData,
    responseStatus,
    requestPayload: body,
  };
}
