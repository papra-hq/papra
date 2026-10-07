import * as v from 'valibot';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { parseParams } from './params.parser';

describe('parseParams', () => {
  test('validated path parameters are returned with schema transformations applied', () => {
    const result = parseParams({
      params: { page: '2' },
      schema: v.object({ page: v.pipe(v.string(), v.transform(Number)) }),
    });

    expect.assert(result.success);
    expectTypeOf(result.params).toEqualTypeOf<{ page: number }>();
    expect(result).toEqual({ success: true, params: { page: 2 } });
  });

  test('an absent schema produces an empty params object', () => {
    const result = parseParams({});

    expect.assert(result.success);
    expectTypeOf(result.params).toEqualTypeOf<Record<string, never>>();
    expect(result).toEqual({ success: true, params: {} });
  });

  test('invalid path parameters produce a validation error response', async () => {
    const result = parseParams({
      params: { userId: '' },
      schema: v.object({ userId: v.pipe(v.string(), v.minLength(1, 'User ID is required')) }),
    });

    expect.assert(!result.success);

    expect(result.response.status).toEqual(400);
    expect(await result.response.json()).toEqual({
      error: {
        message: 'Bad request',
        code: 'api.validation_error',
        details: [{ path: 'userId', message: 'User ID is required' }],
      },
    });
  });
});
