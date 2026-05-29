import type { Clock } from './clock.types';

// The default clock backed by the real system time. Inject a different clock (see clock.test-utils) to control time in tests.
export const systemClock: Clock = {
  now: () => Temporal.Now.instant(),
};
