import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { defineApiContract } from './api.contracts';
import { buildApiRequestHandler } from './api.request-handler';
import { defineApiRoute } from './api.routes';

const echoRoute = defineApiRoute({
  contract: defineApiContract({
    method: 'POST',
    path: '/api/users/:userId',
    request: {
      body: {
        'application/json': v.strictObject({ name: v.pipe(v.string(), v.trim()) }),
      },
      query: v.object({ limit: v.pipe(v.string(), v.transform(Number)) }),
      params: v.object({ userId: v.pipe(v.string(), v.startsWith('usr_')) }),
    },
    responses: {
      201: {
        description: 'Echoes the parsed request.',
        content: {
          'application/json': {
            schema: v.object({
              body: v.object({ name: v.string() }),
              query: v.object({ limit: v.number() }),
              params: v.object({ userId: v.string() }),
              method: v.string(),
            }),
          },
        },
      },
    },
  }),
  handler: async ({ body, query, params, request }) => ({
    status: 201,
    contentType: 'application/json',
    body: { body, query, params, method: request.method },
    headers: { 'X-Request-Id': 'request-1' },
  }),
});

describe('buildApiRequestHandler', () => {
  test('matched routes receive parsed input and return serialized responses', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [echoRoute] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/users/usr_123?limit=10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ name: '  Alice  ' }),
      }),
    });

    expect(response.status).toEqual(201);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.headers.get('X-Request-Id')).toEqual('request-1');
    expect(await response.json()).toEqual({
      body: { name: 'Alice' },
      query: { limit: 10 },
      params: { userId: 'usr_123' },
      method: 'POST',
    });
  });

  test('invalid request bodies return validation errors instead of reaching the handler', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [echoRoute] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/users/usr_123?limit=10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 123 }),
      }),
    });

    expect(response.status).toEqual(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'api.validation_error',
        details: [{ path: 'name' }],
      },
    });
  });

  test('invalid path parameters return validation errors instead of reaching the handler', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [echoRoute] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/users/invalid?limit=10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice' }),
      }),
    });

    expect(response.status).toEqual(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'api.validation_error', details: [{ path: 'userId' }] },
    });
  });

  test('path parameter transformations reach the handler alongside heterogeneous routes', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        echoRoute,
        defineApiRoute({
          contract: defineApiContract({
            method: 'GET',
            path: '/api/pages/:page',
            request: { params: v.object({ page: v.pipe(v.string(), v.transform(Number)) }) },
            responses: {
              200: {
                description: 'The next page.',
                content: { 'application/json': { schema: v.object({ nextPage: v.number() }) } },
              },
            },
          }),
          handler: async ({ params }) => ({
            status: 200,
            contentType: 'application/json',
            body: { nextPage: params.page + 1 },
          }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/pages/2'),
    });

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ nextPage: 3 });
  });

  test('absent schemas yield empty query and params objects and an undefined body', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            method: 'POST',
            path: '/api/ignored/:id',
            responses: { 204: { description: 'No content.', content: {} } },
          }),
          handler: async ({ body, query, params }) => {
            expect({ body, query, params }).toEqual({ body: undefined, query: {}, params: {} });
            return { status: 204 };
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/ignored/123?limit=10', {
        method: 'POST',
        body: 'Ignored',
      }),
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get('Content-Type')).toEqual(null);
    expect(await response.text()).toEqual('');
  });

  test('unmatched requests return a JSON not-found response', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/missing'),
    });

    expect(response.status).toEqual(404);
    expect(await response.json()).toEqual({
      error: { message: 'API route not found', code: 'api.not-found' },
    });
  });

  test('handler failures return a generic error without exposing internal details', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            method: 'GET',
            path: '/api/error',
            responses: {},
          }),
          handler: async () => {
            throw new Error('Sensitive internal details');
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/error'),
    });

    expect(response.status).toEqual(500);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(await response.json()).toEqual({
      error: { message: 'Internal server error', code: 'api.internal-error' },
    });
  });
});
