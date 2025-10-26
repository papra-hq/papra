import type { Subscription } from './subscriptions.types';
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
