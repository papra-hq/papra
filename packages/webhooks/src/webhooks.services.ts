import type { WebhookPayloads } from './webhooks.types';
import { ofetch } from 'ofetch';
import { signBody } from './signature';
import { serializeBody } from './webhooks.models';

export async function webhookHttpClient({
  url,
  ...options
}: {
  url: string;
  method: string;
  body: ArrayBuffer;
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

export async function triggerWebhook({
  webhookUrl,
  webhookSecret,
  httpClient = webhookHttpClient,
  now = new Date(),
  ...payload

}: {
  webhookUrl: string;
  webhookSecret?: string | null;
  httpClient?: typeof webhookHttpClient;
  now?: Date;
} & WebhookPayloads) {
  const { event } = payload;

  const headers: Record<string, string> = {
    'User-Agent': 'papra-webhook-client',
    'Content-Type': 'application/json',
    'X-Event': event,
  };

  const body = serializeBody({ ...payload, now });
  const bodyBuffer = new TextEncoder().encode(body).buffer as ArrayBuffer;

  if (webhookSecret) {
    const { signature } = await signBody({ bodyBuffer, secret: webhookSecret });
    headers['X-Signature'] = signature;
  }

  const { responseData, responseStatus } = await httpClient({
    url: webhookUrl,
    method: 'POST',
    body: bodyBuffer,
    headers,
  });

  return {
    responseData,
    responseStatus,
    requestPayload: body,
  };
}
