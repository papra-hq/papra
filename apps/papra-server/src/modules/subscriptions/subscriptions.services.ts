import type { Config } from '../config/config.types';
import { buildUrl, injectArguments } from '@corentinth/chisels';
import Stripe from 'stripe';

export type SubscriptionsServices = ReturnType<typeof createSubscriptionsServices>;

export function createSubscriptionsServices({ config }: { config: Config }) {
  const stripeClient = new Stripe(config.subscriptions.stripeApiSecretKey);

  return injectArguments(
    {
      createCustomer,
      createCheckoutUrl,
      parseWebhookEvent,
      getCustomerPortalUrl,
      getCheckoutSession,
    },
    { stripeClient, config },
  );
}

async function createCustomer({ stripeClient, email, ownerId, organizationId }: { stripeClient: Stripe; email: string; ownerId: string; organizationId: string }) {
  const customer = await stripeClient.customers.create({
    email,
    metadata: {
      ownerId,
      organizationId,
    },
  });

  const customerId = customer.id;

  return { customerId };
}

export async function createCheckoutUrl({
  stripeClient,
  customerId,
  priceId,
  seatsCount,
  config,
}: {
  stripeClient: Stripe;
  customerId: string;
  priceId: string;
  seatsCount: number;
  config: Config;
}) {
  const { baseUrl } = config.client;

  const successUrl = buildUrl({ baseUrl, path: '/checkout-success?sessionId={CHECKOUT_SESSION_ID}' });
  const cancelUrl = buildUrl({ baseUrl, path: '/checkout-cancel' });

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: seatsCount,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { checkoutUrl: session.url };
}

async function parseWebhookEvent({ stripeClient, payload, signature, config }: { stripeClient: Stripe; payload: any; signature: string; config: Config }) {
  const event = await stripeClient.webhooks.constructEventAsync(payload, signature, config.subscriptions.stripeWebhookSecret);

  return { event };
}

async function getCustomerPortalUrl({
  stripeClient,
  customerId,
  config,
  returnUrl = config.client.baseUrl,
}: {
  stripeClient: Stripe;
  customerId: string;
  returnUrl?: string;
  config: Config;
}) {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { customerPortalUrl: session.url };
}

async function getCheckoutSession({ stripeClient, sessionId }: { stripeClient: Stripe; sessionId: string }) {
  const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId);

  return { checkoutSession };
}
