import { describe, expect, test } from 'vitest';
import { coerceStripeTimestampToDate, doesSubscriptionBlockDeletion, isSignatureHeaderFormatValid } from './subscriptions.models';

describe('subscriptions models', () => {
  describe('coerceStripeTimestampToDate', () => {
    test('stripe api dates are represented as unix timestamps (in seconds) and should be converted to JavaScript dates', () => {
      const date = coerceStripeTimestampToDate(1716150383);

      expect(date).to.deep.equal(new Date(1716150383 * 1000));
      expect(date).to.deep.equal(new Date('2024-05-19T20:26:23.000Z'));
    });
  });

  describe('isSignatureHeaderFormatValid', () => {
    test('the signature value should be a non empty string', () => {
      expect(isSignatureHeaderFormatValid(undefined)).toBe(false);
      expect(isSignatureHeaderFormatValid('')).toBe(false);

      expect(isSignatureHeaderFormatValid('v1_1234567890')).toBe(true);
    });
  });

  describe('doesSubscriptionBlockDeletion', () => {
    describe('organization deletion is blocked to prevent orphaned active subscriptions', () => {
      test('active subscription with ongoing billing blocks deletion', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'active',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(true);
      });

      test('fully active subscription not scheduled for cancellation blocks deletion', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'active',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false, // Fully active, not scheduled to cancel
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(true);
      });

      test('subscription with payment issues still has access and blocks deletion', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'past_due',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(true);
      });

      test('subscription in trial period blocks deletion to maintain trial access', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'trialing',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(true);
      });

      test('subscription with failed payment still maintains access and blocks deletion', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'unpaid',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(true);
      });
    });

    describe('organization deletion is allowed when subscription is terminated or user has canceled', () => {
      test('fully canceled subscription allows deletion since billing has ended', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'canceled',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(false);
      });

      test('organization without subscription can be deleted freely', () => {
        expect(doesSubscriptionBlockDeletion(null)).toBe(false);
      });

      test('organization with no subscription record can be deleted', () => {
        expect(doesSubscriptionBlockDeletion(undefined)).toBe(false);
      });

      test('user who canceled subscription via customer portal can immediately delete organization', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'active',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: true, // User canceled via customer portal, will end at period end
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),

        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(false);
      });

      test('incomplete subscription allows deletion since payment was never completed', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'incomplete',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(false);
      });

      test('incomplete_expired subscription allows deletion since payment failed to complete', () => {
        const subscription = {
          id: 'sub_123',
          organizationId: 'org_123',
          customerId: 'cus_123',
          planId: 'plan_pro',
          status: 'incomplete_expired',
          seatsCount: 5,
          currentPeriodStart: new Date('2025-10-01'),
          currentPeriodEnd: new Date('2025-11-01'),
          cancelAtPeriodEnd: false,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        };

        expect(doesSubscriptionBlockDeletion(subscription)).toBe(false);
      });
    });
  });
});
