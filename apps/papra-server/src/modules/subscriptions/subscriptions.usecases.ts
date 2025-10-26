import type Stripe from 'stripe';
import type { PlansRepository } from '../plans/plans.repository';
import type { Logger } from '../shared/logger/logger';
import type { SubscriptionsRepository } from './subscriptions.repository';
import type { SubscriptionsServices } from './subscriptions.services';
import { get } from 'lodash-es';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { createLogger } from '../shared/logger/logger';
import { isNil } from '../shared/utils';
import { coerceStripeTimestampToDate } from './subscriptions.models';

export async function handleStripeWebhookEvent({
  event,
  plansRepository,
  subscriptionsRepository,
  subscriptionsServices,
  logger = createLogger({ namespace: 'subscriptions' }),
}: {
  event: Stripe.Event;
  subscriptionsRepository: SubscriptionsRepository;
  plansRepository: PlansRepository;
  subscriptionsServices: SubscriptionsServices;
  logger?: Logger;
}) {
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscriptionId = event.data.object.id;
    const organizationId = get(event, 'data.object.metadata.organizationId') as string | undefined;

    if (isNil(organizationId)) {
      throw createOrganizationNotFoundError();
    }

    // Fetch current state from Stripe (source of truth) to handle out-of-order webhooks
    // This ensures we always have the latest data regardless of webhook arrival order
    let stripeSubscription: Stripe.Subscription;

    try {
      const { subscription } = await subscriptionsServices.getSubscription({ subscriptionId });
      stripeSubscription = subscription;

      logger.info({
        subscriptionId,
        status: subscription.status,
        eventType: event.type,
      }, 'Fetched current subscription state from Stripe');
    } catch (error) {
      // Fallback to webhook data if Stripe API fails
      logger.warn({
        subscriptionId,
        error,
        eventType: event.type,
      }, 'Failed to fetch subscription from Stripe, using webhook data as fallback');

      stripeSubscription = event.data.object;
    }

    // Extract data from current Stripe state
    const subscriptionItem = stripeSubscription.items.data[0];

    if (!subscriptionItem) {
      throw new Error(`Subscription ${subscriptionId} has no items`);
    }

    const customerId = typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;
    const currentPeriodEnd = coerceStripeTimestampToDate(stripeSubscription.current_period_end);
    const currentPeriodStart = coerceStripeTimestampToDate(stripeSubscription.current_period_start);
    const cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    const status = stripeSubscription.status;

    // Look up the plan - this might fail if price ID is misconfigured
    const { organizationPlan } = await plansRepository.getOrganizationPlanByPriceId({ priceId: subscriptionItem.price.id });

    // Upsert subscription with current state from Stripe
    await subscriptionsRepository.upsertSubscription({
      id: subscriptionId,
      organizationId,
      planId: organizationPlan.id,
      seatsCount: organizationPlan.limits.maxOrganizationsMembersCount,
      customerId,
      status,
      currentPeriodEnd,
      currentPeriodStart,
      cancelAtPeriodEnd,
    });

    logger.info({
      subscriptionId,
      customerId,
      status,
      planId: organizationPlan.id,
      eventType: event.type,
    }, 'Subscription synced from Stripe current state');

    return;
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscriptionId = event.data.object.id;

    if (isNil(subscriptionId)) {
      return;
    }

    await subscriptionsRepository.updateSubscription({
      subscriptionId,
      status: 'canceled',
    });

    logger.info({ subscriptionId }, 'Subscription canceled');
  }
}
