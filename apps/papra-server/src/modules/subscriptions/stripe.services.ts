import Stripe from 'stripe';

export function createStripeClient({ stripeApiSecretKey }: { stripeApiSecretKey: string }) {
  const stripeClient = new Stripe(stripeApiSecretKey);

  return { stripeClient };
}
