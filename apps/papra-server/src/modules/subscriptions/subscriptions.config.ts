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
} as const satisfies ConfigDefinition;
