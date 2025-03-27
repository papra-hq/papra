import { describe, expect, test } from 'vitest';
import { coerceStripeTimestampToDate } from './subscriptions.models';

describe('subscriptions models', () => {
  describe('coerceStripeTimestampToDate', () => {
    test('stripe api dates are represented as unix timestamps (in seconds) and should be converted to JavaScript dates', () => {
      const date = coerceStripeTimestampToDate(1716150383);

      expect(date).to.deep.equal(new Date(1716150383 * 1000));
      expect(date).to.deep.equal(new Date('2024-05-19T20:26:23.000Z'));
    });
  });
});
