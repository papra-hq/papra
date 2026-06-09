import type { RateLimitKvStore } from './rate-limit.types';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createInMemoryKvStoreDriver } from '../../kv-store/drivers/in-memory/in-memory.kv-store-driver';
import { createKvStore } from '../../kv-store/kv-store';
import { createTestClock } from '../../shared/clock/clock.test-utils';
import { createTooManyRequestsError } from './rate-limit.errors';
import { checkRateLimit, getRateLimit } from './rate-limit.usecases';

function setup() {
  const { clock } = createTestClock();
  const driver = createInMemoryKvStoreDriver({ clock });
  const kvStore = createKvStore({ driver });

  const scope: RateLimitKvStore = kvStore.defineScope({
    prefix: 'rate-limit',
    schema: v.object({ hitCount: v.number(), resetAtEpochMs: v.number() }),
  });

  return { clock, kvStore: scope };
}

describe('rate-limit usecases', () => {
  describe('getRateLimit', () => {
    test('allows hits up to maxHits within the window, then flags the limit as exceeded', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 3, window: { minutes: 1 }, key: 'user-1' };

      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 1,
        hitsRemaining: 2,
      });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 2,
        hitsRemaining: 1,
      });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 3,
        hitsRemaining: 0,
      });

      // The 4th hit exceeds maxHits: the limit is flagged and the counter is not incremented further.
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: true,
        hitCount: 3,
        hitsRemaining: 0,
      });
    });

    test('exposes the window reset instant for response headers and keeps it fixed across hits', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 3, window: { minutes: 1 }, key: 'user-1' };

      // First hit at t=0 opens a window that resets one minute later.
      const expectedResetAt = clock.now().add({ minutes: 1 });
      const first = await getRateLimit({ ...config, kvStore, clock });
      expect(first.resetAt.equals(expectedResetAt)).to.eql(true);

      // Subsequent hits report the same reset instant rather than sliding it forward.
      clock.advanceBy({ seconds: 30 });
      const second = await getRateLimit({ ...config, kvStore, clock });
      expect(second.resetAt.equals(expectedResetAt)).to.eql(true);
    });

    test('the window is fixed and does not slide forward as hits accumulate', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 2, window: { minutes: 1 }, key: 'user-1' };

      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
      });

      clock.advanceBy({ seconds: 50 });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
      });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: true,
      });

      // Past the original reset instant the entry has expired, so the counter starts fresh.
      clock.advanceBy({ seconds: 11 });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 1,
      });
    });

    test('counts are tracked independently per key', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 1, window: { minutes: 1 } };

      expect(await getRateLimit({ ...config, key: 'user-1', kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
      });
      expect(await getRateLimit({ ...config, key: 'user-1', kvStore, clock })).toMatchObject({
        hasExceededLimit: true,
      });

      // A different key is unaffected by user-1 reaching its limit.
      expect(await getRateLimit({ ...config, key: 'user-2', kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 1,
      });
    });

    test('the counter resets once the window has fully elapsed', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 1, window: { minutes: 1 }, key: 'user-1' };

      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
      });
      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: true,
      });

      clock.advanceBy({ minutes: 1 });

      expect(await getRateLimit({ ...config, kvStore, clock })).toMatchObject({
        hasExceededLimit: false,
        hitCount: 1,
      });
    });
  });

  describe('checkRateLimit', () => {
    test('throws an error if the limit has been exceeded', async () => {
      const { clock, kvStore } = setup();
      const config = { maxHits: 1, window: { minutes: 1 }, key: 'user-1', kvStore, clock };

      await checkRateLimit(config);
      await expect(checkRateLimit(config)).rejects.toThrow(createTooManyRequestsError());
    });
  });
});
