import type Stripe from 'stripe';
import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsRepository } from './subscriptions.repository';
import { get } from 'lodash-es';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { coerceStripeTimestampToDate } from './subscriptions.models';

export async function handleStripeWebhookEvent({
  event,
  plansRepository,
  subscriptionsRepository,
}: {
  event: Stripe.Event;
  subscriptionsRepository: SubscriptionsRepository;
  plansRepository: PlansRepository;
}) {
  if (event.type === 'customer.subscription.created') {
    const subscriptionItem = get(event, 'data.object.items.data[0]');
    const customerId = get(event, 'data.object.customer') as string;
    const organizationId = get(event, 'data.object.metadata.organizationId') as string | undefined;
    const currentPeriodEnd = coerceStripeTimestampToDate(get(event, 'data.object.current_period_end'));
    const currentPeriodStart = coerceStripeTimestampToDate(get(event, 'data.object.current_period_start'));
    const cancelAtPeriodEnd = get(event, 'data.object.cancel_at_period_end');
    const status = get(event, 'data.object.status');

    if (!organizationId) {
      throw createOrganizationNotFoundError();
    }

    const { organizationPlan } = await plansRepository.getOrganizationPlanByPriceId({ priceId: subscriptionItem.price.id });

    await subscriptionsRepository.createSubscription({
      id: subscriptionItem.id,
      organizationId,
      planId: organizationPlan.id,
      seatsCount: organizationPlan.limits.maxOrganizationsMembersCount,
      customerId,
      status,
      currentPeriodEnd,
      currentPeriodStart,
      cancelAtPeriodEnd,
    });

    return;
  }

  if (event.type === 'customer.subscription.updated') {
    const subscriptionItem = get(event, 'data.object.items.data[0]');
    const organizationId = get(event, 'data.object.metadata.organizationId') as string | undefined;
    const currentPeriodEnd = coerceStripeTimestampToDate(get(event, 'data.object.current_period_end'));
    const currentPeriodStart = coerceStripeTimestampToDate(get(event, 'data.object.current_period_start'));
    const cancelAtPeriodEnd = get(event, 'data.object.cancel_at_period_end');
    const status = get(event, 'data.object.status');

    if (!organizationId) {
      throw createOrganizationNotFoundError();
    }

    const { organizationPlan } = await plansRepository.getOrganizationPlanByPriceId({ priceId: subscriptionItem.price.id });

    await subscriptionsRepository.updateSubscription({
      subscriptionId: subscriptionItem.id,
      seatsCount: organizationPlan.limits.maxOrganizationsMembersCount,
      status,
      currentPeriodEnd,
      currentPeriodStart,
      cancelAtPeriodEnd,
      planId: organizationPlan.id,
    });
  }
}
