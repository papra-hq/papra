import { createErrorFactory } from '../shared/errors/errors';

export const createWebhookNotFoundError = createErrorFactory({
  message: 'Webhook not found',
  code: 'webhooks.not_found',
  statusCode: 404,
});
