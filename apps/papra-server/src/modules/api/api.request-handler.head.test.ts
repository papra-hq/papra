import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { createError } from '../shared/errors/errors';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { defineApiContract } from './api.contracts';
import { buildApiRequestHandler } from './api.request-handler';
import { defineApiRoute } from './api.routes';

const getDocumentRoute = defineApiRoute({
  contract: defineApiContract({
    method: 'GET',
    path: '/api/documents/:documentId',
    request: {
      params: v.object({ documentId: v.pipe(v.string(), v.startsWith('doc_')) }),
      query: v.object({ format: v.optional(v.literal('text')) }),
    },
    responses: {
      200: {
        description: 'The document content.',
        content: { 'text/plain': { schema: v.string() } },
      },
      404: {
        description: 'The document does not exist.',
        content: { 'text/plain': { schema: v.string() } },
      },
    },
  }),
  handler: async () => ({
    status: 200,
    contentType: 'text/plain',
    body: 'Hello',
    headers: { 'Content-Length': '5', 'ETag': '"v1"', 'X-Route': 'get' },
  }),
});

const headDocumentContract = defineApiContract({
  ...getDocumentRoute.contract,
  method: 'HEAD',
  responses: {
    200: { description: 'The document metadata.', content: {} },
    404: { description: 'The document does not exist.', content: {} },
  },
});

describe('HEAD request handling', () => {
  test('explicit HEAD routes take precedence over GET without changing GET behavior', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        getDocumentRoute,
        defineApiRoute({
          contract: headDocumentContract,
          handler: async () => ({
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
              'Content-Length': '5',
              'ETag': '"v1"',
              'X-Route': 'head',
            },
          }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });
    const getResponse = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123'),
    });

    expect.assert(response);
    expect(response.status).toEqual(200);
    expect(response.headers.get('X-Route')).toEqual('head');
    expect(response.headers.get('Content-Type')).toEqual('text/plain');
    expect(response.headers.get('Content-Length')).toEqual('5');
    expect(response.headers.get('ETag')).toEqual('"v1"');
    expect(response.body).toEqual(null);
    expect(await response.text()).toEqual('');
    expect.assert(getResponse);
    expect(getResponse.status).toEqual(200);
    expect(getResponse.headers.get('X-Route')).toEqual('get');
    expect(await getResponse.text()).toEqual('Hello');
  });

  test('GET fallback validates inputs and passes the original HEAD request through context and handler', async () => {
    const seenRequests: Request[] = [];
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: getDocumentRoute.contract,
          resolveContext: ({ request }) => {
            seenRequests.push(request);
            return { method: request.method };
          },
          handler: async (input) => {
            seenRequests.push(input.request);
            expect(input.context).toEqual({ method: 'HEAD' });
            expect(input.params).toEqual({ documentId: 'doc_123' });
            expect(input.query).toEqual({ format: 'text' });
            expect(input.body).toEqual(undefined);
            return getDocumentRoute.handler({ ...input, context: undefined });
          },
        }),
      ],
    });
    const request = new Request('https://papra.test/api/documents/doc_123?format=text', {
      method: 'HEAD',
    });

    const response = await handleApiRequest({ request });

    expect.assert(response);
    expect(response.status).toEqual(200);
    expect(response.headers.get('X-Route')).toEqual('get');
    expect(response.headers.get('Content-Type')).toEqual('text/plain; charset=utf-8');
    expect(response.headers.get('Content-Length')).toEqual('5');
    expect(response.headers.get('ETag')).toEqual('"v1"');
    expect(response.body).toEqual(null);
    expect(await response.text()).toEqual('');
    expect(seenRequests.map((seenRequest) => seenRequest === request)).toEqual([true, true]);
  });

  test('a matched HEAD route returning 404 does not retry GET or fall through', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        getDocumentRoute,
        defineApiRoute({
          contract: headDocumentContract,
          handler: async () => ({ status: 404, headers: { 'X-Route': 'head' } }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(404);
    expect(response.headers.get('X-Route')).toEqual('head');
    expect(response.body).toEqual(null);
  });

  test('a matched GET fallback returning 404 stays final and loses its body', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: getDocumentRoute.contract,
          handler: async () => ({ status: 404, contentType: 'text/plain', body: 'Not found' }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(404);
    expect(response.headers.get('Content-Type')).toEqual('text/plain; charset=utf-8');
    expect(response.body).toEqual(null);
  });

  test('invalid HEAD path parameters return a bodyless validation error', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [getDocumentRoute] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/invalid', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(400);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('invalid HEAD query parameters return a bodyless validation error', async () => {
    const handleApiRequest = buildApiRequestHandler({ routes: [getDocumentRoute] });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123?format=json', {
        method: 'HEAD',
      }),
    });

    expect.assert(response);
    expect(response.status).toEqual(400);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('GET fallback body parsing failures return bodyless responses', async () => {
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            ...getDocumentRoute.contract,
            request: { body: { 'application/json': v.object({ name: v.string() }) } },
          }),
          handler: async () => ({ status: 200, contentType: 'text/plain', body: 'Hello' }),
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(415);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('HEAD authentication failures preserve their status and headers without a body', async () => {
    const { logger } = createTestLogger();
    const handleApiRequest = buildApiRequestHandler({
      logger,
      routes: [
        defineApiRoute({
          ...getDocumentRoute,
          resolveContext: () => {
            throw createUnauthorizedError();
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/invalid', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(401);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('public HEAD handler errors preserve their status without a body', async () => {
    const { logger } = createTestLogger();
    const handleApiRequest = buildApiRequestHandler({
      logger,
      routes: [
        defineApiRoute({
          contract: getDocumentRoute.contract,
          handler: async () => {
            throw createError({ statusCode: 410, message: 'Gone', code: 'document.gone' });
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(410);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('unexpected HEAD handler failures return a bodyless non-cacheable 500', async () => {
    const { logger } = createTestLogger();
    const handleApiRequest = buildApiRequestHandler({
      logger,
      routes: [
        defineApiRoute({
          contract: headDocumentContract,
          handler: async () => {
            throw new Error('Sensitive details');
          },
        }),
      ],
    });

    const response = await handleApiRequest({
      request: new Request('https://papra.test/api/documents/doc_123', { method: 'HEAD' }),
    });

    expect.assert(response);
    expect(response.status).toEqual(500);
    expect(response.headers.get('Cache-Control')).toEqual('no-store');
    expect(response.body).toEqual(null);
  });

  test('HEAD requests without a HEAD or GET match fall through without resolving context', async () => {
    let contextResolved = false;
    const handleApiRequest = buildApiRequestHandler({
      routes: [
        defineApiRoute({
          contract: defineApiContract({
            method: 'POST',
            path: '/api/documents',
            responses: { 204: { description: 'Created.', content: {} } },
          }),
          resolveContext: () => {
            contextResolved = true;
          },
          handler: async () => ({ status: 204 }),
        }),
      ],
    });

    const unmatchedMethodResponse = await handleApiRequest({
      request: new Request('https://papra.test/api/documents', { method: 'HEAD' }),
    });
    const unmatchedPathResponse = await handleApiRequest({
      request: new Request('https://papra.test/api/missing', { method: 'HEAD' }),
    });

    expect(unmatchedMethodResponse).toEqual(undefined);
    expect(unmatchedPathResponse).toEqual(undefined);
    expect(contextResolved).toEqual(false);
  });
});
