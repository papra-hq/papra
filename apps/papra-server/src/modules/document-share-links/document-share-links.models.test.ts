import { describe, expect, test } from 'vitest';
import { createTestClock } from '../shared/clock/clock.test-utils';
import { shouldTouchShareLinkLastAccessedAt } from './document-share-links.models';

describe('document-share-links.models', () => {
  describe('shouldTouchShareLinkLastAccessedAt', () => {
    const { clock } = createTestClock({ now: '2026-05-12T12:00:00Z' });

    test('update a link lastAccessedAt only if the last access was more than 1min ago', () => {
      expect(shouldTouchShareLinkLastAccessedAt({ lastAccessedAt: Temporal.Instant.from('2026-05-12T11:58:00Z'), clock })).to.eql(true);
      expect(shouldTouchShareLinkLastAccessedAt({ lastAccessedAt: Temporal.Instant.from('2026-05-12T11:59:00Z'), clock })).to.eql(false);
      expect(shouldTouchShareLinkLastAccessedAt({ lastAccessedAt: Temporal.Instant.from('2026-05-12T11:59:01Z'), clock })).to.eql(false);

      expect(shouldTouchShareLinkLastAccessedAt({ lastAccessedAt: null, clock })).to.eql(true);
      expect(shouldTouchShareLinkLastAccessedAt({ lastAccessedAt: undefined, clock })).to.eql(true);
    });
  });
});
