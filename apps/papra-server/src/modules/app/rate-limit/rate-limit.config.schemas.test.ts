import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { rateLimitConfigSchema } from './rate-limit.config.schemas';

describe('rate-limit.config.schemas', () => {
  describe('rateLimitConfigSchema', () => {
    test('validates and transforms rate limit config strings into objects with maxHits and window properties', () => {
      // Advanced format testing in ./rate-limit.config.models.test.ts
      expect(v.parse(rateLimitConfigSchema, '10/2h')).to.eql({
        maxHits: 10,
        window: Temporal.Duration.from({ hours: 2 }),
      });
      expect(v.parse(rateLimitConfigSchema, '2/50m')).to.eql({
        maxHits: 2,
        window: Temporal.Duration.from({ minutes: 50 }),
      });
      expect(v.parse(rateLimitConfigSchema, '2/m')).to.eql({
        maxHits: 2,
        window: Temporal.Duration.from({ minutes: 1 }),
      });
      expect(v.parse(rateLimitConfigSchema, '   2/m  ')).to.eql({
        maxHits: 2,
        window: Temporal.Duration.from({ minutes: 1 }),
      });
    });

    test('invalid format are rejected', () => {
      expect(() => v.parse(rateLimitConfigSchema, 'invalid')).to.throw();
      expect(() => v.parse(rateLimitConfigSchema, '10x2h')).to.throw();
      expect(() => v.parse(rateLimitConfigSchema, '10/')).to.throw();
      expect(() => v.parse(rateLimitConfigSchema, '/2h')).to.throw();
      expect(() => v.parse(rateLimitConfigSchema, '10/2x')).to.throw();
    });
  });
});
