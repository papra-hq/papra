import { createErrorFactory } from '../shared/errors/errors';

export const createWebhookNotFoundError = createErrorFactory({
  message: 'Webhook not found',
  code: 'webhooks.not_found',
  statusCode: 404,
});

export const createSsrfUnsafeUrlError = createErrorFactory({
  message: 'The provided URL is not safe to perform requests to',
  code: 'webhooks.ssrf_unsafe_url',
  statusCode: 400,
});
