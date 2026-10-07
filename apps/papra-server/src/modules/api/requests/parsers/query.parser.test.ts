import * as v from 'valibot';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { parseQuery } from './query.parser';

describe('parseQuery', () => {
  test('query outputs preserve transformations and defaults in their values and types', () => {
    const result = parseQuery({
      url: new URL('https://papra.test?page=2'),
      schema: v.object({
        page: v.pipe(v.string(), v.transform(Number)),
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), '10'),
      }),
    });

    expect.assert(result.success);
    expectTypeOf(result.query).toEqualTypeOf<{ page: number; limit: number }>();
    expect(result.query).toEqual({ page: 2, limit: 10 });
  });

  test('an absent schema produces an empty query object', () => {
    const result = parseQuery({ url: new URL('https://papra.test?page=2') });

    expect.assert(result.success);
    expectTypeOf(result.query).toEqualTypeOf<Record<string, never>>();
    expect(result.query).toEqual({});
  });
});
