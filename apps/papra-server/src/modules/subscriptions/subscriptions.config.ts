import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const subscriptionsConfig = {
  stripeApiSecretKey: {
    doc: 'The API secret key for the Stripe (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'STRIPE_API_SECRET_KEY',
  },
  stripeWebhookSecret: {
    doc: 'The secret for the Stripe webhook (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'STRIPE_WEBHOOK_SECRET',
  },
  globalCouponId: {
    doc: 'The Stripe coupon ID to apply globally for launch promotions',
    schema: z.string().optional(),
    default: undefined,
    env: 'GLOBAL_COUPON_ID',
  },
} as const satisfies ConfigDefinition;
