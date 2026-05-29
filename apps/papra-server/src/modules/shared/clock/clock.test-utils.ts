import type { TestClock } from './clock.types';

export function createTestClock({ now = Temporal.Instant.from('2026-05-12T00:00:00Z') }: { now?: Temporal.InstantLike } = {}): { clock: TestClock } {
  let current: Temporal.Instant = Temporal.Instant.from(now);

  return {
    clock: {
      now: () => current,
      setNow: (instant: Temporal.InstantLike) => {
        current = Temporal.Instant.from(instant);
      },
      advanceBy: (duration: Temporal.DurationLike) => {
        current = current.add(duration);
      },
    },
  };
}
