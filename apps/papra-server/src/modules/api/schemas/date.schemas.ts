import * as v from 'valibot';

export const isoDateTimeSchema = v.pipe(
  v.union([v.string(), v.date()]),
  v.transform((value) => (value instanceof Date ? value.toISOString() : value)),
  v.string(), // Needed for JSON Schema builder to ensure the output type is string
  v.isoTimestamp(),
  v.metadata({
    description: 'An ISO 8601 timestamp.',
    examples: ['2025-01-01T00:00:00.000Z'],
  }),
);
