import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { createError } from '../shared/errors/errors';
import { createTestLogger } from '../shared/logger/logger.test-utils';
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

  test('context resolves once per request before validation and is passed to the handler', async () => {
    const events: string[] = [];
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        echoRoute,
        defineApiRoute({
          contract: defineApiContract({
            ...echoRoute.contract,
            path: '/api/context/:userId',
            request: {
              params: v.pipe(
                echoRoute.contract.request.params,
                v.transform((params) => {
                  events.push('params');
                  return params;
                }),
              ),
              query: v.pipe(
                echoRoute.contract.request.query,
                v.transform((query) => {
                  events.push('query');
                  return query;
                }),
              ),
              body: {
                'application/json': v.pipe(
                  echoRoute.contract.request.body['application/json'],
                  v.transform((body) => {
                    events.push('body');
                    return body;
                  }),
                ),
              },
            },
          }),
          resolveContext: async ({ request }) => {
            events.push('resolve:start');
            await Promise.resolve();
            events.push('resolve:end');
            return { requestId: request.headers.get('X-Request-Id') ?? 'unknown' };
          },
          handler: async ({ context, body, query, params, request }) => {
            events.push('handler');
            return {
              status: 201,
              contentType: 'application/json',
              body: { body, query, params, method: request.method },
              headers: { 'X-Request-Id': context.requestId },
            };
          },
        }),
      ],
    });

    const sendRequest = async (requestId: string) =>
      handleApiRequest({
        request: new Request('https://papra.test/api/context/usr_123?limit=10', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
          body: JSON.stringify({ name: '  Alice  ' }),
        }),
      });

    const firstResponse = await sendRequest('request-1');
    const secondResponse = await sendRequest('request-2');

    expect(firstResponse.status).toEqual(201);
    expect(secondResponse.status).toEqual(201);
    expect(firstResponse.headers.get('X-Request-Id')).toEqual('request-1');
    expect(secondResponse.headers.get('X-Request-Id')).toEqual('request-2');
    expect(await firstResponse.json()).toEqual({
      body: { name: 'Alice' },
      query: { limit: 10 },
      params: { userId: 'usr_123' },
      method: 'POST',
    });
    expect(events).toEqual([
      'resolve:start',
      'resolve:end',
      'params',
      'query',
      'body',
      'handler',
      'resolve:start',
      'resolve:end',
      'params',
      'query',
      'body',
      'handler',
    ]);
  });

  test('synchronous context resolvers provide their return value to the handler', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            method: 'GET',
            path: '/api/context',
            responses: {
              200: {
                description: 'The resolved request path.',
                content: { 'text/plain': { schema: v.string() } },
              },
            },
          }),
          resolveContext: ({ request }) => ({ path: new URL(request.url).pathname }),
          handler: async ({ context }) => ({
            status: 200,
            contentType: 'text/plain',
            body: context.path,
          }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/context'),
    });

    expect(response.status).toEqual(200);
    expect(await response.text()).toEqual('/api/context');
  });

  test('resolver failures stop validation and the handler without exposing internal details', async () => {
    let handlerCalled = false;
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: echoRoute.contract,
          resolveContext: async () => {
            throw new Error('Sensitive resolver details');
          },
          handler: async () => {
            handlerCalled = true;
            throw new Error('The handler must not be called');
          },
        }),
      ],
    });
    const request = new Request('https://papra.test/api/users/invalid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'Invalid JSON',
    });

    const response = await handleApiRequest({ request });

    expect(response.status).toEqual(500);
    expect(await response.json()).toEqual({
      error: { message: 'Internal server error', code: 'api.internal-error' },
    });
    expect(handlerCalled).toEqual(false);
    expect(request.bodyUsed).toEqual(false);
  });

  test('public resolver errors return their status before validation or handler execution', async () => {
    let handlerCalled = false;
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: echoRoute.contract,
          resolveContext: async () => {
            throw createUnauthorizedError();
          },
          handler: async () => {
            handlerCalled = true;
            throw new Error('The handler must not be called');
          },
        }),
      ],
    });
    const request = new Request('https://papra.test/api/users/invalid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'Invalid JSON',
    });

    const response = await handleApiRequest({ request });

    expect(response.status).toEqual(401);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(await response.json()).toEqual({
      error: { message: 'Unauthorized', code: 'auth.unauthorized' },
    });
    expect(handlerCalled).toEqual(false);
    expect(request.bodyUsed).toEqual(false);
  });

  test('public handler errors preserve their status and public payload without being cached', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({ method: 'GET', path: '/api/error', responses: {} }),
          handler: async () => {
            throw createError({
              statusCode: 410,
              message: 'Resource no longer available',
              code: 'resource.gone',
              cause: new Error('Sensitive cause'),
            });
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/error'),
    });

    expect(response.status).toEqual(410);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(await response.json()).toEqual({
      error: { message: 'Resource no longer available', code: 'resource.gone' },
    });
  });

  test('internal custom errors are logged but return a sanitized non-cacheable 500', async () => {
    const { logger, getLogs } = createTestLogger();
    const error = createError({
      statusCode: 503,
      message: 'Sensitive internal details',
      code: 'internal.sensitive',
      isInternal: true,
    });
    const handleApiRequest = buildApiRequestHandler({
      logger,
      routes: [
        defineApiRoute({
          contract: defineApiContract({ method: 'GET', path: '/api/error', responses: {} }),
          handler: async () => {
            throw error;
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/error'),
    });

    expect(response.status).toEqual(500);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(await response.json()).toEqual({
      error: { message: 'Internal server error', code: 'api.internal-error' },
    });
    expect(getLogs()).toMatchObject([
      { level: 'error', message: error.message, data: { error: { message: error.message } } },
    ]);
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
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
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
          handler: async ({ body, query, params, context }) => {
            expect({ body, query, params, context }).toEqual({
              body: undefined,
              query: {},
              params: {},
              context: undefined,
            });
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

  test('unmatched requests return a JSON not-found response without resolving context', async () => {
    let contextResolved = false;
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          ...echoRoute,
          resolveContext: () => {
            contextResolved = true;
            return undefined;
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/missing'),
    });

    expect(response.status).toEqual(404);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(await response.json()).toEqual({
      error: { message: 'API route not found', code: 'api.not-found' },
    });
    expect(contextResolved).toEqual(false);
  });

  test('unexpected handler failures are logged and return a generic error without exposing internal details', async () => {
    const { logger, getLogs } = createTestLogger();
    const error = new Error('Sensitive internal details');
    const handleApiRequest = buildApiRequestHandler({
      logger,
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            method: 'GET',
            path: '/api/error',
            responses: {},
          }),
          handler: async () => {
            throw error;
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/error'),
    });

    expect(response.status).toEqual(500);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(await response.json()).toEqual({
      error: { message: 'Internal server error', code: 'api.internal-error' },
    });
    expect(getLogs()).toMatchObject([
      { level: 'error', message: error.message, data: { error: { message: error.message } } },
    ]);
  });
});
