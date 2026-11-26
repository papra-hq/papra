import * as v from 'valibot';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { parseBody } from './body.parser';

describe('parseBody', () => {
  test('the parsed body is typed as the schema output, including transformations', async () => {
    const result = await parseBody({
      request: new Request('https://papra.test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: '2' }),
      }),
      bodySchemas: {
        'application/json': v.object({ count: v.pipe(v.string(), v.transform(Number)) }),
      },
    });

    expect.assert(result.success);
    expectTypeOf(result.body).toEqualTypeOf<{ count: number }>();
    expect(result.body).toEqual({ count: 2 });
  });

  test('multiple body schemas return the union of their outputs', async () => {
    const result = await parseBody({
      request: new Request('https://papra.test', { method: 'POST', body: '  Hello  ' }),
      bodySchemas: {
        'application/json': v.object({ count: v.number() }),
        'text/plain': v.pipe(v.string(), v.trim()),
      },
    });

    expect.assert(result.success);
    expectTypeOf(result.body).toEqualTypeOf<{ count: number } | string>();
    expect(result.body).toEqual('Hello');
  });

  test('an absent body schema returns undefined', async () => {
    const result = await parseBody({ request: new Request('https://papra.test') });

    expect.assert(result.success);
    expectTypeOf(result.body).toEqualTypeOf<undefined>();
    expect(result.body).toEqual(undefined);
  });
});
