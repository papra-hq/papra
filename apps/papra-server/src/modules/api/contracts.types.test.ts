import { describe, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from './contracts.models';
import type {
  InferClientRequest,
  InferClientResponse,
  InferServerRequest,
  InferServerResponse,
} from './contracts.types';
import { isoDateTimeSchema } from './schemas/date.schemas';

const numberFromStringSchema = v.pipe(v.string(), v.transform(Number), v.number());

const transformedContract = defineEndpointContract({
  method: 'POST',
  path: '/api/organizations/:organizationId/jobs',
  params: v.object({ organizationId: numberFromStringSchema }),
  query: v.object({ page: numberFromStringSchema }),
  body: v.object({ value: numberFromStringSchema }),
  responses: {
    200: v.object({
      createdAt: isoDateTimeSchema,
      result: v.literal('created'),
    }),
    202: v.object({
      createdAt: isoDateTimeSchema,
      jobId: v.string(),
    }),
  },
});

const bodylessContract = defineEndpointContract({
  method: 'GET',
  path: '/api/health',
  responses: {
    200: v.object({ ok: v.boolean() }),
  },
});

describe('contracts.types', () => {
  test('client request types represent schema inputs', () => {
    type ClientRequest = InferClientRequest<typeof transformedContract>;

    expectTypeOf<ClientRequest['params']['organizationId']>().toEqualTypeOf<string>();
    expectTypeOf<ClientRequest['query']['page']>().toEqualTypeOf<string>();
    expectTypeOf<ClientRequest['body']['value']>().toEqualTypeOf<string>();

    const acceptRequest = (_request: ClientRequest) => undefined;

    acceptRequest({
      params: { organizationId: '123' },
      query: { page: '1' },
      body: { value: '42' },
    });

    // @ts-expect-error A body schema makes the client body required.
    acceptRequest({ params: { organizationId: '123' }, query: { page: '1' } });
  });

  test('server request types represent parsed schema outputs', () => {
    type ServerRequest = InferServerRequest<typeof transformedContract>;

    expectTypeOf<ServerRequest['params']['organizationId']>().toEqualTypeOf<number>();
    expectTypeOf<ServerRequest['query']['page']>().toEqualTypeOf<number>();
    expectTypeOf<ServerRequest['body']['value']>().toEqualTypeOf<number>();
  });

  test('endpoints without a body schema reject client bodies', () => {
    type ClientRequest = InferClientRequest<typeof bodylessContract>;
    const acceptRequest = (_request: ClientRequest) => undefined;

    acceptRequest({});

    // @ts-expect-error A body is not accepted when the contract has no body schema.
    acceptRequest({ body: {} });
  });

  test('server responses accept schema inputs for the matching status', () => {
    type ServerResponse = InferServerResponse<typeof transformedContract>;
    const acceptResponse = (_response: ServerResponse) => undefined;

    expectTypeOf<ServerResponse['status']>().toEqualTypeOf<200 | 202>();

    acceptResponse({
      status: 200,
      body: { createdAt: new Date('2025-01-01T00:00:00.000Z'), result: 'created' },
    });
    acceptResponse({
      status: 202,
      body: {
        createdAt: '2025-01-01T00:00:00.000Z',
        jobId: 'job_123',
      },
    });

    // @ts-expect-error The 202 body cannot be returned with a 200 status.
    acceptResponse({ status: 200, body: { createdAt: new Date(), jobId: 'job_123' } });

    // @ts-expect-error The status is not declared by the contract.
    acceptResponse({ status: 201, body: { createdAt: new Date(), result: 'created' } });
  });

  test('client responses contain parsed schema outputs for each status', () => {
    type ClientResponse = InferClientResponse<typeof transformedContract>;
    type CreatedResponse = Extract<ClientResponse, { status: 200 }>;
    type AcceptedResponse = Extract<ClientResponse, { status: 202 }>;

    expectTypeOf<CreatedResponse['body']>().toEqualTypeOf<{
      createdAt: string;
      result: 'created';
    }>();
    expectTypeOf<AcceptedResponse['body']>().toEqualTypeOf<{
      createdAt: string;
      jobId: string;
    }>();

    const acceptResponse = (_response: ClientResponse) => undefined;

    // @ts-expect-error Clients receive the normalized timestamp string, not a Date.
    acceptResponse({ status: 200, body: { createdAt: new Date(), result: 'created' } });
  });
});
