import type { Logger } from '@crowlog/logger';
import type { Buffer } from 'node:buffer';
import type { Config } from '../config/config.types';
import { buildUrl, injectArguments, safely } from '@corentinth/chisels';
import Stripe from 'stripe';
import { getClientBaseUrl } from '../config/config.models';
import { createLogger } from '../shared/logger/logger';
import { isNil, isNonEmptyString } from '../shared/utils';

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
      getCoupon,
      cancelSubscription,
      expireActiveCheckoutSessions,
      getSubscription,
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
  organizationId,
  config,
}: {
  stripeClient: Stripe;
  customerId: string;
  priceId: string;
  organizationId: string;
  config: Config;
}) {
  const { clientBaseUrl } = getClientBaseUrl({ config });

  const successUrl = buildUrl({ baseUrl: clientBaseUrl, path: '/checkout-success?sessionId={CHECKOUT_SESSION_ID}' });
  const cancelUrl = buildUrl({ baseUrl: clientBaseUrl, path: '/checkout-cancel' });

  const { globalCouponId } = config.subscriptions;

  const { coupon } = await getCoupon({ stripeClient, couponId: globalCouponId });

  // If there's no coupon or if the coupon is invalid (expired), we just don't apply any discount but allow promotion codes
  // to be used at checkout, can't do both at the same time
  const discountDetails = isNil(coupon)
    ? { allow_promotion_codes: true }
    : { discounts: [{ coupon: coupon.id }] };

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
        adjustable_quantity: {
          enabled: false,
        },
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organizationId,
      },
    },
    ...discountDetails,
  });

  return { checkoutUrl: session.url };
}

async function parseWebhookEvent({ stripeClient, payload, signature, config }: { stripeClient: Stripe; payload: string | Buffer; signature: string; config: Config }) {
  const event = await stripeClient.webhooks.constructEventAsync(payload, signature, config.subscriptions.stripeWebhookSecret);

  return { event };
}

async function getCustomerPortalUrl({
  stripeClient,
  customerId,
  config,
  returnUrl,
}: {
  stripeClient: Stripe;
  customerId: string;
  returnUrl?: string;
  config: Config;
}) {
  const { clientBaseUrl } = getClientBaseUrl({ config });

  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? clientBaseUrl,
  });

  return { customerPortalUrl: session.url };
}

async function getCheckoutSession({ stripeClient, sessionId }: { stripeClient: Stripe; sessionId: string }) {
  const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId);

  return { checkoutSession };
}

async function getCoupon({ stripeClient, couponId, logger = createLogger({ namespace: 'subscriptions:services:getCoupon' }) }: { stripeClient: Stripe; couponId?: string; logger?: Logger }) {
  if (isNil(couponId)) {
    return { coupon: null };
  }

  const [coupon, error] = await safely(stripeClient.coupons.retrieve(couponId));

  if (!isNil(error)) {
    logger.error({ error }, 'Error while retrieving coupon');
    return { coupon: null };
  }

  if (isNil(coupon)) {
    logger.error({ couponId }, 'Failed to retrieve coupon');
    return { coupon: null };
  }

  if (!coupon.valid) {
    logger.warn({ couponId, couponName: coupon.name }, 'Coupon is not valid');
    return { coupon: null };
  }

  return {
    coupon: {
      id: coupon.id,
      name: coupon.name ?? undefined,
      percentOff: coupon.percent_off ?? undefined,
    },
  };
}

async function cancelSubscription({ stripeClient, subscriptionId }: { stripeClient: Stripe; subscriptionId: string }) {
  await stripeClient.subscriptions.cancel(subscriptionId);

  return { success: true };
}

async function expireActiveCheckoutSessions({ stripeClient, customerId, logger = createLogger({ namespace: 'subscriptions:services:expireActiveCheckoutSessions' }) }: { stripeClient: Stripe; customerId: string; logger?: Logger }) {
  // List all open checkout sessions for this customer
  // Note: Checkout sessions auto-expire after 24h, so 100 limit is typically sufficient
  // For edge cases with 100+ sessions, we paginate through all results
  let hasMore = true;
  let startingAfter: string | undefined;
  const sessionsIds = new Set<string>();

  while (hasMore) {
    const sessions = await stripeClient.checkout.sessions.list({
      customer: customerId,
      status: 'open',
      limit: 100,
      ...(isNonEmptyString(startingAfter) ? { starting_after: startingAfter } : {}),
    });

    sessions.data.forEach(({ id }) => sessionsIds.add(id));
    hasMore = sessions.has_more;

    const lastSession = sessions.data[sessions.data.length - 1];
    if (lastSession) {
      startingAfter = lastSession.id;
    }
  }

  // Expire each open session
  await Promise.allSettled(
    Array.from(sessionsIds).map(async (sessionId) => {
      try {
        await stripeClient.checkout.sessions.expire(sessionId);
        logger.info({ customerId, sessionId }, 'Expired checkout session');
      } catch (error) {
        logger.warn({ customerId, sessionId, error }, 'Failed to expire checkout session');
      }
    }),
  );

  logger.info({ customerId, totalSessions: sessionsIds.size }, 'Expired active checkout sessions');
}

async function getSubscription({ stripeClient, subscriptionId }: { stripeClient: Stripe; subscriptionId: string }) {
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

  return { subscription };
}
