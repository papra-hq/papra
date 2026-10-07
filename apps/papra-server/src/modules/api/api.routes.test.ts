import type { ApiHandlerInput, ApiHandlerResult, ApiRoute } from './api.routes';
import * as v from 'valibot';
import { describe, expectTypeOf, test } from 'vitest';
import { defineApiContract } from './api.contracts';
import { defineApiRoute } from './api.routes';

const wireDateSchema = v.pipe(
  v.union([v.date(), v.string()]),
  v.transform((value) => new Date(value).toISOString()),
);

const contract = defineApiContract({
  method: 'POST',
  path: '/api/items/:id',
  request: {
    params: v.object({ id: v.pipe(v.string(), v.transform(Number)) }),
    query: v.object({ limit: v.optional(v.pipe(v.string(), v.transform(Number)), '10') }),
    body: {
      'application/json': v.object({
        name: v.string(),
        count: v.pipe(v.string(), v.transform(Number)),
      }),
    },
  },
  responses: {
    200: {
      description: 'An item or its name.',
      content: {
        'application/json': {
          schema: v.object({
            name: v.string(),
            createdAt: wireDateSchema,
            tags: v.array(v.string()),
          }),
        },
        'text/plain': { schema: v.string() },
      },
    },
    400: {
      description: 'An error.',
      content: { 'application/json': { schema: v.object({ error: v.string() }) } },
    },
    204: { description: 'No content.', content: {} },
    205: { description: 'Reset content.', content: {} },
    304: { description: 'Not modified.', content: {} },
  },
});

describe('defineApiRoute types', () => {
  test('handlers infer parsed request outputs and retain their contract', () => {
    const route = defineApiRoute({
      contract,
      handler: async ({ body, query, params, request }) => {
        expectTypeOf(body).toEqualTypeOf<{ name: string; count: number }>();
        expectTypeOf(query).toEqualTypeOf<{ limit: number }>();
        expectTypeOf(params).toEqualTypeOf<{ id: number }>();
        expectTypeOf(request).toEqualTypeOf<Request>();

        return {
          status: 200,
          contentType: 'application/json',
          body: { name: body.name, createdAt: new Date().toISOString(), tags: ['item'] },
        };
      },
    });

    expectTypeOf(route).toEqualTypeOf<ApiRoute<typeof contract>>();
    expectTypeOf(route.contract.method).toEqualTypeOf<'POST'>();
    expectTypeOf(route.contract.path).toEqualTypeOf<'/api/items/:id'>();
    expectTypeOf(route.contract.responses[200].content['application/json'].schema).toEqualTypeOf<
      (typeof contract.responses)[200]['content']['application/json']['schema']
    >();
  });

  test('missing schemas produce empty query and params objects and an undefined body, without inferring the path', () => {
    defineApiRoute({
      contract: defineApiContract({
        method: 'GET',
        path: '/api/items/:id',
        responses: { 204: { description: 'No content.', content: {} } },
      }),
      handler: async ({ body, query, params }) => {
        expectTypeOf(body).toEqualTypeOf<undefined>();
        expectTypeOf(query).toEqualTypeOf<Record<string, never>>();
        expectTypeOf(params).toEqualTypeOf<Record<string, never>>();
        return { status: 204 };
      },
    });
  });

  test('multiple request content types produce a union of parsed body outputs', () => {
    defineApiRoute({
      contract: defineApiContract({
        method: 'POST',
        path: '/api/items',
        request: {
          body: {
            'application/json': v.object({ count: v.pipe(v.string(), v.transform(Number)) }),
            'text/plain': v.string(),
          },
        },
        responses: { 204: { description: 'No content.', content: {} } },
      }),
      handler: async ({ body, query, params }) => {
        expectTypeOf(body).toEqualTypeOf<{ count: number } | string>();
        expectTypeOf(query).toEqualTypeOf<Record<string, never>>();
        expectTypeOf(params).toEqualTypeOf<Record<string, never>>();
        return { status: 204 };
      },
    });
  });

  test('response status and content type discriminate schema outputs, including bodyless statuses', () => {
    expectTypeOf<ApiHandlerResult<typeof contract>>().toEqualTypeOf<
      | {
          status: 200;
          contentType: 'application/json';
          body: { name: string; createdAt: string; tags: string[] };
          headers?: Record<string, string>;
        }
      | { status: 200; contentType: 'text/plain'; body: string; headers?: Record<string, string> }
      | {
          status: 400;
          contentType: 'application/json';
          body: { error: string };
          headers?: Record<string, string>;
        }
      | { status: 204; contentType?: never; body?: never; headers?: Record<string, string> }
      | { status: 205; contentType?: never; body?: never; headers?: Record<string, string> }
      | { status: 304; contentType?: never; body?: never; headers?: Record<string, string> }
    >();

    defineApiRoute({
      contract,
      handler: async ({ body }) => {
        if (body.count < 0) {
          return { status: 400, contentType: 'application/json', body: { error: 'Invalid count' } };
        }

        if (body.count === 0) {
          return { status: 204, headers: { 'X-Empty': 'true' } };
        }

        return { status: 200, contentType: 'text/plain', body: body.name };
      },
    });
  });

  test('handlers cannot widen the contract by returning an undeclared status or content type', () => {
    defineApiRoute({
      contract,
      // @ts-expect-error Only statuses declared by the contract are allowed.
      handler: async () => ({
        status: 201,
        contentType: 'application/json',
        body: { error: 'Invalid' },
      }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error This content type exists for 200, not 400.
      handler: async () => ({ status: 400, contentType: 'text/plain', body: 'Invalid' }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error Undeclared content types cannot be returned.
      handler: async () => ({ status: 200, contentType: 'text/html', body: 'Invalid' }),
    });
  });

  test('response bodies must match the output schema for their status and content type', () => {
    defineApiRoute({
      contract,
      // @ts-expect-error Schema input accepts Date, but handlers must return the string output.
      handler: async () => ({
        status: 200,
        contentType: 'application/json',
        body: { name: 'Item', createdAt: new Date(), tags: [] },
      }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error This JSON body belongs to status 400, not 200.
      handler: async () => ({
        status: 200,
        contentType: 'application/json',
        body: { error: 'Invalid' },
      }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error Plain text responses must use the declared string output.
      handler: async () => ({ status: 200, contentType: 'text/plain', body: { name: 'Item' } }),
    });
  });

  test('contentful responses require both a content type and a body', () => {
    defineApiRoute({
      contract,
      // @ts-expect-error Content-Type cannot be omitted for a contentful response.
      handler: async () => ({ status: 200, body: 'Item' }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error A body cannot be omitted for a contentful response.
      handler: async () => ({ status: 200, contentType: 'text/plain' }),
    });
  });

  test('bodyless statuses reject bodies and content types', () => {
    defineApiRoute({
      contract,
      // @ts-expect-error Bodyless statuses cannot carry a body.
      handler: async () => ({ status: 204, body: 'Item' }),
    });

    defineApiRoute({
      contract,
      // @ts-expect-error Bodyless statuses cannot specify a content type.
      handler: async () => ({ status: 304, contentType: 'application/json' }),
    });
  });

  test('bodyless statuses cannot declare response content in their contract', () => {
    defineApiContract({
      method: 'DELETE',
      path: '/api/items/:id',
      responses: {
        204: {
          description: 'No content.',
          content: {
            // @ts-expect-error Bodyless statuses cannot declare a payload schema.
            'application/json': { schema: v.string() },
          },
        },
      },
    });
  });

  test('exported input types preserve request outputs', () => {
    expectTypeOf<ApiHandlerInput<typeof contract>>().toEqualTypeOf<{
      body: { name: string; count: number };
      query: { limit: number };
      params: { id: number };
      request: Request;
    }>();
  });
});
