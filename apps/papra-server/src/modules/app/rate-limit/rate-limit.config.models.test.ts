import { describe, expect, test } from 'vitest';
import { parseRateLimitConfig } from './rate-limit.config.models';

describe('rate-limit.config.models', () => {
  describe('parseRateLimitConfig', () => {
    test('parses rate limit config, like "10/2h", "2/5m", into a maxHits and window in Temporal.Duration', () => {
      expect(parseRateLimitConfig('10/2h')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ hours: 2 }) });
      expect(parseRateLimitConfig('2/50m')).to.eql({ maxHits: 2, window: Temporal.Duration.from({ minutes: 50 }) });
    });

    test('the duration value is optional and defaults to 1, so "10/h" is equivalent to "10/1h"', () => {
      expect(parseRateLimitConfig('10/h')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ hours: 1 }) });
    });

    test('window unit are case-insensitive, so "10/2H" is equivalent to "10/2h"', () => {
      expect(parseRateLimitConfig('10/2H')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ hours: 2 }) });
    });

    test('trims whitespace around the config string', () => {
      expect(parseRateLimitConfig('  10/2h  ')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ hours: 2 }) });
    });

    test('units can be seconds (s), minutes (m) or hours (h)', () => {
      expect(parseRateLimitConfig('10/30s')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ seconds: 30 }) });
      expect(parseRateLimitConfig('10/15m')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ minutes: 15 }) });
      expect(parseRateLimitConfig('10/1h')).to.eql({ maxHits: 10, window: Temporal.Duration.from({ hours: 1 }) });
    });

    test('throws if the format is invalid', () => {
      expect(() => parseRateLimitConfig('invalid')).to.throw('Invalid rate limit format: "invalid". Expected formats like "10/h", "10/2h", "2/5m", etc.');
      expect(() => parseRateLimitConfig('10x2h')).to.throw('Invalid rate limit format: "10x2h". Expected formats like "10/h", "10/2h", "2/5m", etc.');
      expect(() => parseRateLimitConfig('10/')).to.throw('Invalid rate limit format: "10/". Expected formats like "10/h", "10/2h", "2/5m", etc.');
      expect(() => parseRateLimitConfig('/2h')).to.throw('Invalid rate limit format: "/2h". Expected formats like "10/h", "10/2h", "2/5m", etc.');
      expect(() => parseRateLimitConfig('10/2x')).to.throw('Invalid rate limit format: "10/2x". Expected formats like "10/h", "10/2h", "2/5m", etc.');
      expect(() => parseRateLimitConfig('')).to.throw('Invalid rate limit format: "". Expected formats like "10/h", "10/2h", "2/5m", etc.');
    });
  });
});
