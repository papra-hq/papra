import type { Subscription } from './subscriptions.types';
import type {
  DbInsertableOrganizationSubscription,
  DbSelectableOrganizationSubscription,
  InsertableOrganizationSubscription,
  OrganizationSubscription,
} from './subscriptions.new.tables';
import { isNil, isNonEmptyString } from '../shared/utils';

export function coerceStripeTimestampToDate(timestamp: number) {
  return new Date(timestamp * 1000);
}

export function isSignatureHeaderFormatValid(signature: string | undefined): signature is string {
  if (isNil(signature)) {
    return false;
  }

  return isNonEmptyString(signature);
}

/**
 * Determines if a subscription should prevent organization deletion.
 *
 * Organization deletion is allowed when:
 * - No subscription exists (null/undefined)
 * - Subscription status is 'canceled' (fully terminated)
 * - Subscription status is 'incomplete' or 'incomplete_expired' (payment never completed)
 * - Subscription is scheduled to cancel at period end (cancelAtPeriodEnd is true)
 *   - User has already expressed intent to cancel
 *   - Organization will lose access at period end anyway
 *
 * Organization deletion is blocked for active subscriptions with:
 * - 'active' status AND cancelAtPeriodEnd is false
 * - 'past_due' status (payment issues, but still has access)
 * - 'trialing' status (in trial period)
 * - 'unpaid' status (payment failed but subscription remains)
 *
 * @param subscription - The subscription to check, or null/undefined if no subscription exists
 * @returns true if the subscription blocks deletion, false otherwise
 */
export function doesSubscriptionBlockDeletion(subscription: Subscription | null | undefined): boolean {
  if (!subscription) {
    return false;
  }

  // Fully canceled subscriptions don't block deletion
  if (subscription.status === 'canceled') {
    return false;
  }

  // Incomplete subscriptions don't block deletion (payment never completed)
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    return false;
  }

  // Subscriptions scheduled to cancel at period end don't block deletion
  // User has already expressed intent to cancel, so let them delete the org
  if (subscription.cancelAtPeriodEnd) {
    return false;
  }

  // All other subscription statuses block deletion
  return true;
}

// DB <-> Business model transformers

export function dbToOrganizationSubscription(dbSubscription?: DbSelectableOrganizationSubscription): OrganizationSubscription | undefined {
  if (!dbSubscription) {
    return undefined;
  }

  return {
    id: dbSubscription.id,
    customerId: dbSubscription.customer_id,
    organizationId: dbSubscription.organization_id,
    planId: dbSubscription.plan_id,
    status: dbSubscription.status,
    seatsCount: dbSubscription.seats_count,
    cancelAtPeriodEnd: dbSubscription.cancel_at_period_end === 1,
    createdAt: new Date(dbSubscription.created_at),
    updatedAt: new Date(dbSubscription.updated_at),
    currentPeriodEnd: new Date(dbSubscription.current_period_end),
    currentPeriodStart: new Date(dbSubscription.current_period_start),
  };
}

export function organizationSubscriptionToDb(
  subscription: InsertableOrganizationSubscription,
  {
    now = new Date(),
  }: {
    now?: Date;
  } = {},
): DbInsertableOrganizationSubscription {
  return {
    id: subscription.id,
    customer_id: subscription.customerId,
    organization_id: subscription.organizationId,
    plan_id: subscription.planId,
    status: subscription.status,
    seats_count: subscription.seatsCount,
    cancel_at_period_end: subscription.cancelAtPeriodEnd === true ? 1 : 0,
    created_at: subscription.createdAt?.getTime() ?? now.getTime(),
    updated_at: subscription.updatedAt?.getTime() ?? now.getTime(),
    current_period_end: subscription.currentPeriodEnd.getTime(),
    current_period_start: subscription.currentPeriodStart.getTime(),
  };
}
