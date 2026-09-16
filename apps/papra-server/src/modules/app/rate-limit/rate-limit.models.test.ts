import { describe, expect, test } from 'vitest';
import { computeRetryAfterDuration } from './rate-limit.models';
import { createTestClock } from '../../shared/clock/clock.test-utils';

describe('rate-limit.models', () => {
  describe('computeRetryAfterDuration', () => {
    test('when resetAt is in the future, returns the duration until resetAt in seconds', () => {
      const { clock } = createTestClock({ now: Temporal.Instant.from('2024-06-01T12:00:00Z') });
      const resetAt = Temporal.Instant.from('2024-06-01T12:05:00Z');

      expect(computeRetryAfterDuration({ resetAt, clock })).toEqual(5 * 60);
    });

    test('when resetAt is in the past, returns a duration of 0', () => {
      const { clock } = createTestClock({ now: Temporal.Instant.from('2024-06-01T12:00:00Z') });
      const resetAt = Temporal.Instant.from('2024-06-01T11:55:00Z');

      expect(computeRetryAfterDuration({ resetAt, clock })).toEqual(0);
    });

    test('the duration is ceiled to the next whole second, and is at least 1 second', () => {
      const { clock } = createTestClock({ now: Temporal.Instant.from('2024-06-01T12:00:00Z') });
      const resetAt = Temporal.Instant.from('2024-06-01T12:00:00.500Z');

      expect(computeRetryAfterDuration({ resetAt, clock })).toEqual(1);
    });
  });
});
