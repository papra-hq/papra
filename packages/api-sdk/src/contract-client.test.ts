import type { ApiContract } from '@papra/app-server/api/contract';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createContractClient } from './contract-client';
import { ApiHttpError, ApiResponseError } from './contract-client.errors';
import { createApiClient } from './http-client';

const getItemContract = {
  method: 'GET',
  path: '/api/items',
  responses: {
    200: {
      description: 'An item.',
      content: { 'application/json': { schema: v.object({ name: v.string() }) } },
    },
  },
} as const satisfies ApiContract;

function createTestClient<const Contract extends ApiContract>(
  contract: Contract,
  respond: (request: Request) => Response | Promise<Response>,
) {
  const requests: Request[] = [];
  const { apiClient } = createApiClient({
    apiBaseUrl: 'https://papra.example',
    fetch: async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      return await respond(request);
    },
  });

  return { client: createContractClient({ contracts: { call: contract }, apiClient }), requests };
}

describe('contract client', () => {
  test('path and query values are encoded and request transformations are left to the server', async () => {
    let transformations = 0;
    const { client, requests } = createTestClient(
      {
        ...getItemContract,
        method: 'POST',
        path: '/api/items/:id',
        request: {
          params: v.object({ id: v.string() }),
          query: v.object({ search: v.string(), page: v.optional(v.string()) }),
          body: {
            'application/json': v.object({
              count: v.pipe(
                v.string(),
                v.transform((value) => {
                  transformations++;
                  return Number(value) + 1;
                }),
              ),
            }),
          },
        },
        responses: {
          200: {
            description: 'A parsed count.',
            content: {
              'application/json': {
                schema: v.object({ count: v.pipe(v.string(), v.transform(Number)) }),
              },
            },
          },
        },
      },
      () =>
        Response.json(
          { count: '3' },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
        ),
    );

    expect(
      await client.call({
        params: { id: 'a/b ?' },
        query: { search: 'x&y', page: undefined },
        body: { count: '2' },
      }),
    ).toEqual({ count: 3 });
    expect(transformations).toEqual(0);
    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request?.url).toEqual('https://papra.example/api/items/a%2Fb%20%3F?search=x%26y');
    expect(request?.method).toEqual('POST');
    expect(request?.headers.get('Content-Type')).toEqual('application/json');
    expect(request?.headers.get('Accept')).toEqual('application/json');
    expect(await request?.json()).toEqual({ count: '2' });
  });

  test('JSON string bodies are serialized rather than sent as unquoted text', async () => {
    const { client, requests } = createTestClient(
      { ...getItemContract, method: 'PUT', request: { body: { 'application/json': v.string() } } },
      () => Response.json({ name: 'Alice' }),
    );

    await client.call({ body: 'Alice' });

    expect(await requests[0]?.text()).toEqual('"Alice"');
  });

  test('the actual success status selects its response schema', async () => {
    const { client } = createTestClient(
      {
        ...getItemContract,
        responses: {
          ...getItemContract.responses,
          201: {
            description: 'A created item.',
            content: { 'application/json': { schema: v.object({ id: v.number() }) } },
          },
        },
      },
      () => Response.json({ id: 123 }, { status: 201 }),
    );

    expect(await client.call()).toEqual({ id: 123 });
  });

  test('bodyless successful responses return undefined without parsing JSON', async () => {
    const { client } = createTestClient(
      {
        method: 'DELETE',
        path: '/api/items',
        responses: { 204: { description: 'Deleted.', content: {} } },
      },
      () => new Response(null, { status: 204 }),
    );

    expect(await client.call()).toEqual(undefined);
  });

  test('HTTP failures expose their status and JSON payload even when undeclared', async () => {
    const data = { error: { code: 'auth.unauthorized', message: 'Unauthorized' } };
    const { client } = createTestClient(getItemContract, () =>
      Response.json(data, { status: 401 }),
    );
    const result = client.call();

    await expect(result).rejects.toBeInstanceOf(ApiHttpError);
    await expect(result).rejects.toMatchObject({
      status: 401,
      data,
      method: 'GET',
      path: '/api/items',
    });
  });

  test('non-JSON HTTP failures retain their body and are not retried', async () => {
    const { client, requests } = createTestClient(
      getItemContract,
      () => new Response('Bad gateway', { status: 502 }),
    );
    const result = client.call();

    await expect(result).rejects.toBeInstanceOf(ApiHttpError);
    await expect(result).rejects.toMatchObject({ status: 502, data: 'Bad gateway' });
    expect(requests).toHaveLength(1);
  });

  test('a successful response with an invalid payload is a contract error, not an HTTP error', async () => {
    const { client } = createTestClient(getItemContract, () => Response.json({ name: 123 }));
    const result = client.call();

    await expect(result).rejects.toBeInstanceOf(ApiResponseError);
    await expect(result).rejects.toMatchObject({ status: 200, cause: { name: 'ValiError' } });
  });

  test('undeclared success statuses are rejected', async () => {
    const { client } = createTestClient(getItemContract, () =>
      Response.json({ name: 'Alice' }, { status: 201 }),
    );

    await expect(client.call()).rejects.toMatchObject({
      name: 'ApiResponseError',
      status: 201,
      message: 'GET /api/items: Undeclared response status',
    });
  });

  test('a JSON-looking response with an undeclared content type is rejected', async () => {
    const { client } = createTestClient(
      getItemContract,
      () => new Response('{"name":"Alice"}', { headers: { 'Content-Type': 'text/plain' } }),
    );

    await expect(client.call()).rejects.toMatchObject({
      name: 'ApiResponseError',
      message: 'GET /api/items: Unexpected response Content-Type',
    });
  });

  test('malformed JSON cannot satisfy even a string response schema', async () => {
    const { client } = createTestClient(
      {
        ...getItemContract,
        responses: {
          200: { description: 'A name.', content: { 'application/json': { schema: v.string() } } },
        },
      },
      () => new Response('Alice', { headers: { 'Content-Type': 'application/json' } }),
    );

    await expect(client.call()).rejects.toBeInstanceOf(ApiResponseError);
  });

  test('unsupported request formats fail when building the client', () => {
    expect(() =>
      createTestClient(
        { ...getItemContract, method: 'POST', request: { body: { 'text/plain': v.string() } } },
        () => Response.json({ name: 'Alice' }),
      ),
    ).toThrow('only JSON request bodies are supported');
  });

  test('unsupported response formats fail when building the client', () => {
    expect(() =>
      createTestClient(
        {
          ...getItemContract,
          responses: {
            200: { description: 'A name.', content: { 'text/plain': { schema: v.string() } } },
          },
        },
        () => new Response('Alice'),
      ),
    ).toThrow('only JSON or bodyless responses are supported');
  });

  test('path traversal values are rejected before a request is made', async () => {
    const { client, requests } = createTestClient(
      {
        ...getItemContract,
        path: '/api/items/:id',
        request: { params: v.object({ id: v.string() }) },
      },
      () => Response.json({ name: 'Alice' }),
    );

    await expect(client.call({ params: { id: '..' } })).rejects.toThrow(
      'Invalid path parameter: id',
    );
    expect(requests).toHaveLength(0);
  });
});
