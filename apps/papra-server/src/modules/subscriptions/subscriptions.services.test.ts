import type Stripe from 'stripe';
import { describe, expect, test } from 'vitest';
import { resolveCheckoutDiscount } from './subscriptions.services';

function createStripeClientStub({
  coupons = {},
}: { coupons?: Record<string, { valid: boolean }> } = {}) {
  return {
    coupons: {
      retrieve: async (couponId: string) => {
        const coupon = coupons[couponId];

        if (!coupon) {
          throw new Error(`No such coupon: ${couponId}`);
        }

        return { id: couponId, valid: coupon.valid };
      },
    },
  } as unknown as Stripe;
}

describe('subscriptions services', () => {
  describe('resolveCheckoutDiscount', () => {
    test('the entitlement coupon takes precedence over the global coupon', async () => {
      const stripeClient = createStripeClientStub({
        coupons: {
          'entitlement-coupon': { valid: true },
          'global-coupon': { valid: true },
        },
      });

      const { discountDetails } = await resolveCheckoutDiscount({
        stripeClient,
        entitlementCouponId: 'entitlement-coupon',
        globalCouponId: 'global-coupon',
      });

      expect(discountDetails).to.eql({ discounts: [{ coupon: 'entitlement-coupon' }] });
    });

    test('when the entitlement coupon is invalid, the global coupon is applied', async () => {
      const stripeClient = createStripeClientStub({
        coupons: {
          'entitlement-coupon': { valid: false },
          'global-coupon': { valid: true },
        },
      });

      const { discountDetails } = await resolveCheckoutDiscount({
        stripeClient,
        entitlementCouponId: 'entitlement-coupon',
        globalCouponId: 'global-coupon',
      });

      expect(discountDetails).to.eql({ discounts: [{ coupon: 'global-coupon' }] });
    });

    test('when no entitlement coupon is provided, the global coupon is applied', async () => {
      const stripeClient = createStripeClientStub({
        coupons: {
          'global-coupon': { valid: true },
        },
      });

      const { discountDetails } = await resolveCheckoutDiscount({
        stripeClient,
        globalCouponId: 'global-coupon',
      });

      expect(discountDetails).to.eql({ discounts: [{ coupon: 'global-coupon' }] });
    });

    test('when no coupon is valid, promotion codes are allowed instead of a discount', async () => {
      const stripeClient = createStripeClientStub({
        coupons: {
          'entitlement-coupon': { valid: false },
        },
      });

      const { discountDetails } = await resolveCheckoutDiscount({
        stripeClient,
        entitlementCouponId: 'entitlement-coupon',
        globalCouponId: 'global-coupon',
      });

      expect(discountDetails).to.eql({ allow_promotion_codes: true });
    });

    test('when no coupon is configured, promotion codes are allowed', async () => {
      const stripeClient = createStripeClientStub();

      const { discountDetails } = await resolveCheckoutDiscount({ stripeClient });

      expect(discountDetails).to.eql({ allow_promotion_codes: true });
    });
  });
});
