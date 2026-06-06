import type { Clock } from '../../shared/clock/clock.types';
import type { RateLimitKvStore } from './rate-limit.types';
import { systemClock } from '../../shared/clock/clock';
import { createTooManyRequestsError } from './rate-limit.errors';

type RateLimitResult = {
  hasExceededLimit: boolean;
  hitCount: number;
  hitsRemaining: number;
  resetAt: Temporal.Instant;
};

export async function getRateLimit({
  maxHits,
  window,
  key,
  kvStore,
  clock = systemClock,
}: {
  maxHits: number;
  window: Temporal.DurationLike;
  key: string;
  kvStore: RateLimitKvStore;
  clock?: Clock;
}): Promise<RateLimitResult> {
  const now = clock.now();

  const entry = await kvStore.get(key);

  if (!entry) {
    const resetAt = now.add(window);
    await kvStore.set(key, { hitCount: 1, resetAtEpochMs: resetAt.epochMilliseconds }, { expiresAt: resetAt });
    return {
      hasExceededLimit: false,
      hitCount: 1,
      hitsRemaining: maxHits - 1,
      resetAt,
    };
  }

  // The kv store filters out expired entries on read, so an existing entry is always within its window.
  if (entry.hitCount >= maxHits) {
    return {
      hasExceededLimit: true,
      hitCount: entry.hitCount,
      hitsRemaining: 0,
      resetAt: Temporal.Instant.fromEpochMilliseconds(entry.resetAtEpochMs),
    };
  }

  // Keep the original reset instant so the window stays fixed instead of sliding forward on each hit.
  const resetAt = Temporal.Instant.fromEpochMilliseconds(entry.resetAtEpochMs);
  const hitCount = entry.hitCount + 1;
  await kvStore.set(key, { hitCount, resetAtEpochMs: entry.resetAtEpochMs }, { expiresAt: resetAt });

  return {
    hasExceededLimit: false,
    hitCount,
    hitsRemaining: maxHits - hitCount,
    resetAt,
  };
}

export async function checkRateLimit(args: Parameters<typeof getRateLimit>[0]) {
  const result = await getRateLimit(args);

  if (result.hasExceededLimit) {
    throw createTooManyRequestsError();
  }
}
