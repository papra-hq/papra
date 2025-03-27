import { createErrorFactory } from '../shared/errors/errors';

export const createOrganizationAlreadyHasSubscriptionError = createErrorFactory({
  message: 'Organization already has an active subscription',
  code: 'subscriptions.organization_already_has_subscription',
  statusCode: 400,
});

export const createUserHasNoSubscriptionError = createErrorFactory({
  message: 'User does not have an active subscription',
  code: 'subscriptions.user_has_no_subscription',
  statusCode: 400,
});

export const createInvalidWebhookPayloadError = createErrorFactory({
  message: 'Invalid webhook payload',
  code: 'subscriptions.invalid_webhook_payload',
  statusCode: 400,
});
