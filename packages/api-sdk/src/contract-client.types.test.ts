import type { ApiContract } from '@papra/app-server/api/contract';
import type {
  ClientMethod,
  ClientRequest,
  ClientResponse,
  ContractClient,
} from './contract-client.types';
import * as v from 'valibot';
import { describe, expectTypeOf, test } from 'vitest';

const contracts = {
  getItemContract: {
    operationId: 'getItem',
    method: 'GET',
    path: '/api/items',
    responses: {
      200: {
        description: 'An item.',
        content: { 'application/json': { schema: v.object({ name: v.string() }) } },
      },
    },
  },
  updateItemContract: {
    operationId: 'updateItem',
    method: 'PUT',
    path: '/api/items/:id',
    request: {
      params: v.object({ id: v.pipe(v.string(), v.transform(Number)) }),
      query: v.object({ page: v.optional(v.pipe(v.string(), v.transform(Number)), '1') }),
      body: { 'application/json': v.object({ count: v.pipe(v.string(), v.transform(Number)) }) },
    },
    responses: {
      200: {
        description: 'A count.',
        content: {
          'application/json': {
            schema: v.object({ count: v.pipe(v.string(), v.transform(Number)) }),
          },
        },
      },
      201: {
        description: 'An id.',
        content: { 'application/json': { schema: v.object({ id: v.string() }) } },
      },
      204: { description: 'No content.', content: {} },
      400: {
        description: 'Invalid input.',
        content: { 'application/json': { schema: v.object({ error: v.string() }) } },
      },
    },
  },
  searchItemsContract: {
    operationId: 'searchItems',
    method: 'GET',
    path: '/api/items/search',
    request: { query: v.object({ search: v.string() }) },
    responses: { 204: { description: 'No content.', content: {} } },
  },
} as const satisfies Record<string, ApiContract>;

describe('contract client types', () => {
  test('request types use schema inputs, before transformations and defaults', () => {
    expectTypeOf<ClientRequest<typeof contracts.updateItemContract>>().toEqualTypeOf<
      {
        params: { id: string };
      } & {
        query?: { page?: string };
      } & {
        body: { count: string };
      }
    >();
  });

  test('response types contain parsed successful bodies, excluding HTTP errors', () => {
    expectTypeOf<ClientResponse<typeof contracts.updateItemContract>>().toEqualTypeOf<
      { count: number } | { id: string } | void
    >();
    expectTypeOf<ClientResponse<typeof contracts.searchItemsContract>>().toEqualTypeOf<void>();
  });

  test('methods require only their declared inputs and use operation IDs', () => {
    expectTypeOf<keyof ContractClient<typeof contracts>>().toEqualTypeOf<
      'getItem' | 'updateItem' | 'searchItems'
    >();
    expectTypeOf<ClientMethod<typeof contracts.getItemContract>>().toBeCallableWith();
    expectTypeOf<ClientMethod<typeof contracts.updateItemContract>>().toBeCallableWith({
      params: { id: '123' },
      body: { count: '2' },
    });
    expectTypeOf<ClientMethod<typeof contracts.searchItemsContract>>().toBeCallableWith({
      query: { search: 'Alice' },
    });

    // Compile-only calls: invalid invocations must not issue real requests.
    function checkInputs(client: ContractClient<typeof contracts>) {
      // @ts-expect-error An update requires its body and path parameters.
      void client.updateItem();
      // @ts-expect-error Path parameters cannot be omitted.
      void client.updateItem({ body: { count: '2' } });
      // @ts-expect-error The body accepts the wire string, not the server's parsed number.
      void client.updateItem({ params: { id: '123' }, body: { count: 2 } });
      // @ts-expect-error This endpoint has no request body.
      void client.getItem({ body: { name: 'Alice' } });
      // @ts-expect-error A required query cannot be omitted.
      void client.searchItems();
      // @ts-expect-error Methods cannot override the contract's HTTP method.
      void client.getItem({ method: 'POST' });
      // @ts-expect-error Unknown methods are not exposed.
      void client.deleteItem();
      // @ts-expect-error Registry export names are not exposed as methods.
      void client.getItemContract();
    }

    expectTypeOf(checkInputs).toBeFunction();
  });

  test('a query consisting only of optional fields allows a no-argument call', () => {
    const contract = {
      ...contracts.getItemContract,
      request: { query: v.object({ limit: v.optional(v.string(), '10') }) },
    };

    expectTypeOf<ClientMethod<typeof contract>>().toBeCallableWith();
    expectTypeOf<ClientMethod<typeof contract>>().toBeCallableWith({ query: { limit: '20' } });
  });
});
