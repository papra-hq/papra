import type { Clock } from '../../shared/clock/clock.types';
import { systemClock } from '../../shared/clock/clock';

export function computeRetryAfterDuration({
  resetAt,
  clock = systemClock,
}: {
  resetAt: Temporal.Instant;
  clock?: Clock;
}): number {
  const now = clock.now();
  if (Temporal.Instant.compare(resetAt, now) <= 0) {
    return 0;
  }
  const retryAfter = resetAt.since(now).total('seconds');
  return Math.max(1, Math.ceil(retryAfter));
}
