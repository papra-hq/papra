import { toJsonSchema } from '@valibot/to-json-schema';
import { describe, expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { isoDateTimeSchema } from './date.schemas';

describe('date.schemas', () => {
  describe('isoDateTimeSchema', () => {
    test('accepts a Date and serializes it to an ISO timestamp', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');

      expect(v.parse(isoDateTimeSchema, date)).to.eql('2025-01-01T00:00:00.000Z');
    });

    test('accepts an ISO timestamp string without changing it', () => {
      const timestamp = '2025-01-01T00:00:00.000Z';

      expect(v.parse(isoDateTimeSchema, timestamp)).to.eql(timestamp);
    });

    test('rejects invalid strings and dates', () => {
      expect(v.safeParse(isoDateTimeSchema, 'not-a-date').success).to.eql(false);
      expect(v.safeParse(isoDateTimeSchema, new Date('invalid')).success).to.eql(false);
    });

    test('can parse its serialized JSON output', () => {
      const serializedTimestamp = v.parse(isoDateTimeSchema, new Date('2025-01-01T00:00:00.000Z'));
      const wireTimestamp: unknown = JSON.parse(JSON.stringify(serializedTimestamp));

      expect(v.parse(isoDateTimeSchema, wireTimestamp)).to.eql(serializedTimestamp);
    });

    test('accepts Date or string inputs and always outputs a string', () => {
      expectTypeOf<v.InferInput<typeof isoDateTimeSchema>>().toEqualTypeOf<string | Date>();
      expectTypeOf<v.InferOutput<typeof isoDateTimeSchema>>().toEqualTypeOf<string>();
    });

    test('documents its output as an ISO date-time string', () => {
      expect(
        toJsonSchema(isoDateTimeSchema, {
          typeMode: 'output',
          target: 'openapi-3.0',
        }),
      ).to.eql({
        type: 'string',
        format: 'date-time',
        description: 'An ISO 8601 timestamp.',
        examples: ['2025-01-01T00:00:00.000Z'],
      });
    });
  });
});
